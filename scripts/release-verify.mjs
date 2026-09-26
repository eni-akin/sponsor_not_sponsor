import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

await import('./package.mjs');
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const archive = resolve(`release/sponsor-not-sponsor-${version}.zip`);
const unpacked = await mkdtemp(join(tmpdir(), 'sns-release-review-'));
execFileSync('unzip', ['-q', archive, '-d', unpacked]);
const environment = { ...process.env, EXTENSION_DIR: unpacked };
const checks = [];
for (const script of ['browser-smoke.mjs', 'popup-sizing.mjs', 'store-screenshots.mjs']) {
  console.log(`Checking packaged extension: ${script}`);
  execFileSync(process.execPath, [`scripts/${script}`], { stdio: 'inherit', env: environment });
  checks.push(script);
}
await writeFile('release/validation.json', JSON.stringify({
  version, verifiedAt: new Date().toISOString(),
  archiveSha256: createHash('sha256').update(await readFile(archive)).digest('hex'),
  checks, scope: 'Packaged extension on local fictional fixtures; not independent real-world beta validation.',
}, null, 2) + '\n');
console.log('PASS: the extracted release archive passed browser, toolbar sizing, and screenshot/help checks.');
