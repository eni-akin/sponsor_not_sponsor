import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { releaseFiles } from './release-files.mjs';

await import('./build.mjs');
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(manifest.version, pkg.version, 'Package and manifest versions must agree');
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['storage']);
assert.deepEqual(manifest.optional_host_permissions, ['http://127.0.0.1:4318/*']);
assert.ok(manifest.description.length <= 132);
const references = [manifest.background.service_worker, manifest.action.default_popup,
  ...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon),
  ...manifest.content_scripts.flatMap(script => script.js)];
for (const file of references) assert.ok(releaseFiles.includes(file), `Missing manifest asset: ${file}`);
const inventory = [];
for (const file of releaseFiles) {
  const bytes = await readFile(`dist/${file}`);
  assert.ok(bytes.length, `Empty release file: ${file}`);
  if (file.endsWith('.png')) {
    const size = Number(file.match(/icon-(\d+)/)[1]);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  inventory.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
// Package only reviewed runtime assets, never the repository, service, .env, or caches.
// Start a new archive so files from a previous release cannot survive an update.
const temporary = await mkdtemp(join(tmpdir(), 'sns-package-'));
const archive = join(temporary, 'extension.zip');
execFileSync('zip', ['-X', '-q', archive, ...releaseFiles], { cwd: resolve('dist') });
const contents = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n').sort();
assert.deepEqual(contents, releaseFiles, 'Archive must contain only the release allowlist');
for (const item of inventory) {
  const bytes = execFileSync('unzip', ['-p', archive, item.file]);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
}
await mkdir('release', { recursive: true });
const name = `sponsor-not-sponsor-${manifest.version}.zip`;
const bytes = await readFile(archive);
await writeFile(`release/${name}`, bytes);
await writeFile(`release/${name}.sha256`, `${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);
await writeFile(`release/${name}.inventory.json`, JSON.stringify({ version: manifest.version, files: inventory }, null, 2) + '\n');
console.log(`Verified ${releaseFiles.length} files in release/${name}. Publication is a separate step.`);
