#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    realpathSync,
} from 'node:fs';
import {
    basename,
    dirname,
    join,
    resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
    const options = {
        json: false,
        session: 'default',
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--json') {
            options.json = true;
            continue;
        }
        if (arg === '--session') {
            options.session = argv[index + 1] ?? options.session;
            index += 1;
            continue;
        }
        if (arg.startsWith('--session=')) {
            options.session = arg.slice('--session='.length);
            continue;
        }
        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!/^[\w.-]+$/.test(options.session) || options.session.includes('..')) {
        throw new Error(`Invalid session name: ${options.session}`);
    }

    return options;
}

function findProjectRoot(startDir) {
    let current = resolve(startDir);
    while (true) {
        const packagePath = join(current, 'package.json');
        if (existsSync(packagePath)) {
            const packageJson = readJson(packagePath);
            if (packageJson?.name === 'evb-viewer') {
                return current;
            }
        }

        const parent = dirname(current);
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}

function readJson(path) {
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return null;
    }
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function isSessionInfo(value) {
    return value
        && isPositiveInteger(value.port)
        && isPositiveInteger(value.pid)
        && isPositiveInteger(value.cdpPort)
        && (value.electronPid === null || isPositiveInteger(value.electronPid))
        && (value.nuxtPid === null || isPositiveInteger(value.nuxtPid));
}

function readCommand(pid) {
    if (!isPositiveInteger(pid)) {
        return null;
    }
    try {
        const output = execFileSync('ps', [
            '-p',
            String(pid),
            '-o',
            'command=',
        ], { encoding: 'utf8' }).trim();
        return output || null;
    } catch {
        return null;
    }
}

function readProcessTable() {
    try {
        const output = execFileSync('ps', [
            '-ax',
            '-o',
            'pid=,command=',
        ], { encoding: 'utf8' });
        return output
            .split('\n')
            .map(line => {
                const match = line.match(/^\s*(\d+)\s+(.+)$/);
                if (!match) {
                    return null;
                }
                return {
                    command: match[2],
                    pid: Number(match[1]),
                };
            })
            .filter(Boolean);
    } catch {
        return [];
    }
}

function extractAppPath(command) {
    const marker = '.app/Contents/MacOS/';
    const markerIndex = command.indexOf(marker);
    if (markerIndex === -1) {
        return null;
    }
    return command.slice(0, markerIndex + '.app'.length);
}

function withTrailingSlash(value) {
    return value.endsWith('/') ? value : `${value}/`;
}

function tryRealpath(path) {
    try {
        return realpathSync(path);
    } catch {
        return path;
    }
}

function classifyElectronApps(processes, projectRoot, targetPid) {
    return processes
        .map(entry => {
            const appPath = extractAppPath(entry.command);
            if (!appPath) {
                return null;
            }

            const appName = basename(appPath);
            if (appName.includes('Helper')) {
                return null;
            }

            const isRepoPath = appPath.startsWith(`${projectRoot}/`);
            const isAutomationPath = entry.command.includes('/.devkit/sessions/')
                && entry.command.includes('/automation-electron-app/');
            const isPackagedEvbViewer = appPath === '/Applications/EVB Viewer.app';
            const isRelevant = isRepoPath || isAutomationPath || isPackagedEvbViewer;
            if (!isRelevant) {
                return null;
            }

            return {
                appName,
                appPath,
                command: entry.command,
                isAutomationPath,
                isGenericElectron: appName === 'Electron.app',
                isPackagedEvbViewer,
                isTarget: entry.pid === targetPid,
                pid: entry.pid,
            };
        })
        .filter(Boolean);
}

async function readCdpVersion(cdpEndpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
        const response = await fetch(`${cdpEndpoint}/json/version`, { signal: controller.signal });
        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
            };
        }
        const body = await response.json();
        return {
            ok: true,
            browser: body.Browser ?? null,
            webSocketDebuggerUrl: body.webSocketDebuggerUrl ?? null,
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : String(error),
            ok: false,
        };
    } finally {
        clearTimeout(timer);
    }
}

function formatAppEntry(entry) {
    const labels = [];
    if (entry.isTarget) {
        labels.push('target');
    }
    if (entry.isAutomationPath) {
        labels.push('stale automation candidate');
    }
    if (entry.isPackagedEvbViewer) {
        labels.push('packaged app');
    }
    if (entry.isGenericElectron) {
        labels.push('generic Electron bundle');
    }
    return `  pid ${entry.pid}: ${entry.appPath}${labels.length > 0 ? ` (${labels.join(', ')})` : ''}`;
}

function printText(report) {
    process.stdout.write('EVB Viewer Computer Use target\n');
    process.stdout.write(`Session: ${report.session}\n`);
    process.stdout.write(`Session file: ${report.sessionFile}\n`);
    process.stdout.write(`Status: ${report.ready ? 'ready' : 'not ready'}\n\n`);

    if (report.errors.length > 0) {
        process.stdout.write('Errors:\n');
        for (const error of report.errors) {
            process.stdout.write(`  - ${error}\n`);
        }
        process.stdout.write('\n');
    }

    if (report.sessionInfo) {
        process.stdout.write(`Electron PID: ${report.sessionInfo.electronPid ?? 'missing'}\n`);
        process.stdout.write(`Nuxt port: ${report.sessionInfo.nuxtPort ?? 'missing'}\n`);
        process.stdout.write(`CDP endpoint: ${report.cdpEndpoint}\n`);
        process.stdout.write(`Renderer URL: http://127.0.0.1:${report.sessionInfo.nuxtPort ?? 3235}/electron\n`);
    }

    if (report.computerUseStateApp) {
        process.stdout.write(`Computer Use state app: ${report.computerUseStateApp}\n`);
        process.stdout.write(`Resolved app path: ${report.resolvedAppPath}\n`);
    }

    if (report.cdpVersion?.ok) {
        process.stdout.write(`CDP browser: ${report.cdpVersion.browser ?? 'unknown'}\n`);
    } else if (report.cdpVersion) {
        process.stdout.write(`CDP check: unavailable${report.cdpVersion.error ? ` (${report.cdpVersion.error})` : ''}\n`);
    }

    if (report.relevantApps.length > 0) {
        process.stdout.write('\nRelevant Electron-family apps:\n');
        for (const entry of report.relevantApps) {
            process.stdout.write(`${formatAppEntry(entry)}\n`);
        }
    }

    if (report.warnings.length > 0) {
        process.stdout.write('\nWarnings:\n');
        for (const warning of report.warnings) {
            process.stdout.write(`  - ${warning}\n`);
        }
    }

    process.stdout.write('\nUse this target:\n');
    process.stdout.write('  - Call Computer Use get_app_state with the Computer Use state app path above.\n');
    process.stdout.write('  - Use the CDP endpoint for clicks, typing, keyboard input, and stress-test loops.\n');
    process.stdout.write('  - Ask before stopping dev servers or terminating stale Electron processes.\n');
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const projectRoot = findProjectRoot(process.cwd()) ?? resolve(scriptDir, '..', '..', '..', '..');
    const sessionFile = join(projectRoot, '.devkit', 'sessions', options.session, 'session.json');
    const rawSessionInfo = readJson(sessionFile);
    const errors = [];
    const warnings = [];

    if (!isSessionInfo(rawSessionInfo)) {
        errors.push(`No valid Electron dev session found at ${sessionFile}`);
    }

    const sessionInfo = isSessionInfo(rawSessionInfo) ? rawSessionInfo : null;
    const cdpEndpoint = sessionInfo ? `http://127.0.0.1:${sessionInfo.cdpPort}` : null;
    const command = sessionInfo?.electronPid ? readCommand(sessionInfo.electronPid) : null;
    const extractedAppPath = command ? extractAppPath(command) : null;
    if (sessionInfo?.electronPid && !command) {
        errors.push(`Electron PID ${sessionInfo.electronPid} is not running`);
    }
    if (sessionInfo && !extractedAppPath) {
        errors.push(`Electron PID ${sessionInfo.electronPid ?? 'missing'} did not expose an .app command path`);
    }

    const processes = readProcessTable();
    const relevantApps = classifyElectronApps(processes, projectRoot, sessionInfo?.electronPid ?? null);
    const duplicateGenericElectronApps = relevantApps.filter(entry => entry.isGenericElectron && !entry.isTarget);
    const staleAutomationApps = relevantApps.filter(entry => entry.isAutomationPath && !entry.isTarget);
    const packagedApps = relevantApps.filter(entry => entry.isPackagedEvbViewer);

    if (duplicateGenericElectronApps.length > 0) {
        warnings.push('Generic Electron app-name targeting is ambiguous because another Electron.app is running.');
    }
    if (staleAutomationApps.length > 0) {
        warnings.push('A stale automation Electron.app is running under .devkit/sessions; it can steal app-name Computer Use targeting.');
    }
    if (packagedApps.length > 0) {
        warnings.push('The packaged EVB Viewer app is also running; keep the dev app target explicit.');
    }

    warnings.push('Observed Computer Use 829 behavior in this repo: exact-path get_app_state can work while click/type/press_key returns -10005 noWindowsAvailable. Use CDP for actions when that happens.');

    const cdpVersion = cdpEndpoint ? await readCdpVersion(cdpEndpoint) : null;
    if (cdpVersion && !cdpVersion.ok) {
        warnings.push('The CDP endpoint did not respond; restart or inspect the dev session before driving interactions.');
    }

    const report = {
        cdpEndpoint,
        cdpVersion,
        command,
        computerUseStateApp: extractedAppPath ? withTrailingSlash(extractedAppPath) : null,
        errors,
        ready: errors.length === 0 && Boolean(cdpVersion?.ok),
        relevantApps,
        resolvedAppPath: extractedAppPath ? withTrailingSlash(tryRealpath(extractedAppPath)) : null,
        session: options.session,
        sessionFile,
        sessionInfo,
        warnings,
    };

    if (options.json) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
        return;
    }

    printText(report);
    if (report.errors.length > 0) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
});
