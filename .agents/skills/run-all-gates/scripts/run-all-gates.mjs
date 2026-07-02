#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
    createWriteStream,
    existsSync,
    mkdirSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const gates = [
    {
        args: [
            'run',
            'validate',
        ],
        command: 'pnpm',
        description: 'Project validation: lint, typecheck, type coverage, strict build, fallow, architecture',
        id: 'validate',
    },
    {
        args: [
            'run',
            'test:coverage',
        ],
        command: 'pnpm',
        description: 'Unit coverage run and coverage ratchet',
        id: 'test-coverage',
    },
    {
        args: [
            'run',
            'release:verify',
        ],
        command: 'pnpm',
        description: 'Full local release verification checks and package verification',
        id: 'release-verify',
    },
    {
        args: ['.agents/skills/run-all-gates/scripts/release-cut-preflight.mjs'],
        command: 'node',
        description: 'Release-cut preflight: clean worktree, upstream, GitHub auth, Node baseline, next patch tag availability',
        id: 'release-cut-preflight',
    },
];

function usage() {
    return `Usage: node .agents/skills/run-all-gates/scripts/run-all-gates.mjs [options]

Runs the EVB Viewer gate sequence and logs each gate under .devkit/gates/<timestamp>/.

Options:
  --list             Print available gates and exit
  --only <gate>      Run only one gate
  --from <gate>      Start at a specific gate and continue
  --skip <gate>      Skip a gate; may be repeated
  --help             Show this help
`;
}

function findRepoRoot(startDirectory) {
    let directory = path.resolve(startDirectory);

    while (true) {
        if (
            existsSync(path.join(directory, 'package.json'))
            && existsSync(path.join(directory, 'pnpm-workspace.yaml'))
            && existsSync(path.join(directory, 'CLAUDE.md'))
        ) {
            return directory;
        }

        const parent = path.dirname(directory);
        if (parent === directory) {
            throw new Error('Could not find the evb-viewer repository root.');
        }
        directory = parent;
    }
}

function parseArgs(argv) {
    const options = {
        from: undefined,
        list: false,
        only: undefined,
        skip: new Set(),
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--help' || arg === '-h') {
            process.stdout.write(usage());
            process.exit(0);
        }

        if (arg === '--list') {
            options.list = true;
            continue;
        }

        if (arg === '--only' || arg === '--from' || arg === '--skip') {
            const value = argv[index + 1];
            if (!value) {
                throw new Error(`${arg} requires a gate id.`);
            }
            index += 1;

            if (arg === '--only') {
                options.only = value;
            } else if (arg === '--from') {
                options.from = value;
            } else {
                options.skip.add(value);
            }
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return options;
}

function selectGates(options) {
    const knownIds = new Set(gates.map(gate => gate.id));

    for (const id of [
        options.only,
        options.from,
        ...options.skip,
    ]) {
        if (id != null && !knownIds.has(id)) {
            throw new Error(`Unknown gate "${id}". Use --list to see available gates.`);
        }
    }

    let selected = gates;

    if (options.only != null) {
        selected = gates.filter(gate => gate.id === options.only);
    } else if (options.from != null) {
        const startIndex = gates.findIndex(gate => gate.id === options.from);
        selected = gates.slice(startIndex);
    }

    return selected.filter(gate => !options.skip.has(gate.id));
}

function commandText(gate) {
    return [
        gate.command,
        ...gate.args,
    ].join(' ');
}

function timestamp() {
    return new Date()
        .toISOString()
        .replaceAll(':', '')
        .replace(/\.\d{3}Z$/, 'Z');
}

function runGate(gate, {
    index,
    logDirectory,
    repoRoot,
}) {
    return new Promise(resolve => {
        const logPath = path.join(logDirectory, `${String(index + 1).padStart(2, '0')}-${gate.id}.log`);
        const logStream = createWriteStream(logPath, {flags: 'w'});
        const startedAt = new Date();

        process.stdout.write(`\n[gate:${gate.id}] ${commandText(gate)}\n`);
        process.stdout.write(`[gate:${gate.id}] ${gate.description}\n`);
        process.stdout.write(`[gate:${gate.id}] log: ${logPath}\n`);

        logStream.write(`# ${gate.id}\n`);
        logStream.write(`# command: ${commandText(gate)}\n`);
        logStream.write(`# cwd: ${repoRoot}\n`);
        logStream.write(`# started: ${startedAt.toISOString()}\n\n`);

        const child = spawn(gate.command, gate.args, {
            cwd: repoRoot,
            env: {
                ...process.env,
                FORCE_COLOR: process.env.FORCE_COLOR ?? '1',
            },
            stdio: [
                'ignore',
                'pipe',
                'pipe',
            ],
        });

        const forwardSigint = () => {
            child.kill('SIGINT');
        };
        const forwardSigterm = () => {
            child.kill('SIGTERM');
        };

        process.once('SIGINT', forwardSigint);
        process.once('SIGTERM', forwardSigterm);

        child.stdout.on('data', chunk => {
            process.stdout.write(chunk);
            logStream.write(chunk);
        });

        child.stderr.on('data', chunk => {
            process.stderr.write(chunk);
            logStream.write(chunk);
        });

        child.on('error', error => {
            process.off('SIGINT', forwardSigint);
            process.off('SIGTERM', forwardSigterm);
            logStream.write(`\n# spawn error: ${error.message}\n`);
            logStream.end();
            resolve({
                code: 1,
                gate,
                logPath,
                signal: undefined,
                startedAt,
                stoppedAt: new Date(),
            });
        });

        child.on('close', (code, signal) => {
            process.off('SIGINT', forwardSigint);
            process.off('SIGTERM', forwardSigterm);

            const stoppedAt = new Date();
            logStream.write(`\n# stopped: ${stoppedAt.toISOString()}\n`);
            logStream.write(`# exitCode: ${code ?? ''}\n`);
            logStream.write(`# signal: ${signal ?? ''}\n`);
            logStream.end();

            resolve({
                code: code ?? (signal == null ? 0 : 1),
                gate,
                logPath,
                signal,
                startedAt,
                stoppedAt,
            });
        });
    });
}

function writeSummary(logDirectory, results) {
    const summary = {
        finishedAt: new Date().toISOString(),
        results: results.map(result => ({
            command: commandText(result.gate),
            exitCode: result.code,
            gate: result.gate.id,
            logPath: result.logPath,
            signal: result.signal,
            startedAt: result.startedAt.toISOString(),
            stoppedAt: result.stoppedAt.toISOString(),
        })),
    };

    writeFileSync(
        path.join(logDirectory, 'summary.json'),
        `${JSON.stringify(summary, null, 2)}\n`,
    );
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.list) {
        for (const gate of gates) {
            process.stdout.write(`${gate.id}\t${commandText(gate)}\t${gate.description}\n`);
        }
        return;
    }

    const selectedGates = selectGates(options);
    if (selectedGates.length === 0) {
        throw new Error('No gates selected.');
    }

    const repoRoot = findRepoRoot(process.cwd());
    const logDirectory = path.join(repoRoot, '.devkit', 'gates', timestamp());
    mkdirSync(logDirectory, {recursive: true});

    process.stdout.write(`Gate logs: ${logDirectory}\n`);

    const results = [];

    for (const gate of selectedGates) {
        const result = await runGate(gate, {
            index: gates.findIndex(candidate => candidate.id === gate.id),
            logDirectory,
            repoRoot,
        });
        results.push(result);
        writeSummary(logDirectory, results);

        if (result.code !== 0) {
            process.stderr.write(`\nGate failed: ${gate.id}\n`);
            process.stderr.write(`Log: ${result.logPath}\n`);
            process.exitCode = result.code;
            return;
        }
    }

    process.stdout.write('\nAll selected gates passed.\n');
    process.stdout.write(`Summary: ${path.join(logDirectory, 'summary.json')}\n`);
}

main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
});
