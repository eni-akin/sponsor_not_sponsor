import { spawn } from 'node:child_process';
const child = spawn(process.env.DECISION_PYTHON || '.decision-venv/bin/python', ['server/laya_worker.py', '--load-only'], { stdio: 'inherit', env: process.env });
child.on('error', () => { console.error('Cannot start Python. Follow server/DECISIONS.md to install the model runtime.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
