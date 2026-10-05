import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const policy = 'Vanguard does not offer visa sponsorship for this role.';
const html = `<main>
  <h1>Engineering Intern</h1>
  <h2>Responsibilities</h2><p>Build reliable software with the team.</p>
  <h2>Qualifications</h2><p>${policy}</p>
  <a href="/apply">Apply</a>
  <input value="PRIVATE_ANSWER"><textarea>PRIVATE_UPLOAD</textarea>
</main>`;
const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(html);
});
const outputRoot = await mkdtemp(join(tmpdir(), 'sns-laya-capture-test-'));

try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const goodUrl = `http://127.0.0.1:${server.address().port}/job`;
  const child = spawn(process.execPath, ['scripts/capture-laya-evidence.mjs', '--allow-local',
    'http://127.0.0.1:1/fail', goodUrl], {
    env: { ...process.env, CAPTURE_OUTPUT_ROOT: outputRoot }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  const code = await new Promise(resolve => child.once('exit', resolve));
  assert.equal(code, 0, stderr);

  const runDirectory = stdout.trim().split('\n').at(-1);
  assert.ok(runDirectory?.startsWith(`${outputRoot}/`));
  const manifestText = await readFile(join(runDirectory, 'manifest.json'), 'utf8');
  const failedText = await readFile(join(runDirectory, '001.json'), 'utf8');
  const capturedText = await readFile(join(runDirectory, '002.json'), 'utf8');
  const manifest = JSON.parse(manifestText);
  const failed = JSON.parse(failedText);
  const captured = JSON.parse(capturedText);

  assert.equal(manifest.blankSession, true);
  assert.equal(manifest.applicantValuesEntered, false);
  assert.match(manifest.extensionBuildSha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.cases.length, 2);
  assert.equal(failed.error, 'navigation-failed');
  assert.equal(failed.role, null);
  assert.equal(captured.finalUrl, goodUrl);
  assert.equal(captured.extraction.completeness, 'description-found');
  assert.ok(captured.role.evidence.some(block => block.text === policy
    && block.source === 'visible-page' && block.kind === 'text'));
  assert.equal(captured.requestedUrlSha256, sha256(goodUrl));
  assert.equal(captured.finalUrlSha256, sha256(goodUrl));
  assert.equal(captured.layaInputSha256, sha256(JSON.stringify(captured.layaInput)));
  assert.equal(captured.sourceHashes[0].url, goodUrl);
  assert.match(captured.sourceHashes[0].evidenceSha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.cases[1].layaInputSha256, captured.layaInputSha256);
  assert.doesNotMatch(manifestText + failedText + capturedText, /PRIVATE_ANSWER|PRIVATE_UPLOAD/);
  console.log('PASS: Laya evidence capture preserves failures, public evidence and hashes without form values.');
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(outputRoot, { recursive: true, force: true });
}
