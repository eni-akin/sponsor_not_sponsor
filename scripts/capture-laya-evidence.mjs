import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const allowLocal = args.includes('--allow-local');
const urls = args.filter(arg => arg !== '--allow-local');
if (!urls.length) {
  console.error('Usage: node scripts/capture-laya-evidence.mjs [--allow-local] URL...');
  process.exit(2);
}

const sha256 = value => createHash('sha256').update(value).digest('hex');
const privateHost = host => host === 'localhost' || host === '::1' || /^127\./.test(host)
  || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
const checkedUrl = value => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error(`Only credential-free HTTP(S) URLs are accepted: ${value}`);
  if (!allowLocal && privateHost(url.hostname))
    throw new Error(`Local/private URLs require --allow-local: ${value}`);
  return url.toString();
};
const requestedUrls = urls.map(checkedUrl);

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('node_modules/.cache/playwright');
const { chromium } = await import('playwright');
const extensionPath = await realpath(process.env.EXTENSION_DIR ?? 'dist');
const extensionManifest = JSON.parse(await readFile(join(extensionPath, 'manifest.json'), 'utf8'));
const extensionId = sha256(extensionPath).slice(0, 32).replace(/[0-9a-f]/g, char => 'abcdefghijklmnop'[parseInt(char, 16)]);
const directoryDigest = async directory => {
  const hash = createHash('sha256');
  const visit = async (path, prefix = '') => {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = join(prefix, entry.name);
      if (entry.isDirectory()) await visit(join(path, entry.name), relative);
      else if (entry.isFile()) hash.update(relative).update('\0').update(await readFile(join(path, entry.name)));
    }
  };
  await visit(directory);
  return hash.digest('hex');
};
const extensionBuildSha256 = await directoryDigest(extensionPath);
const outputRoot = resolve(process.env.CAPTURE_OUTPUT_ROOT ?? 'evaluation/laya-experiment/captures');
await mkdir(outputRoot, { recursive: true });
const runDirectory = await mkdtemp(join(outputRoot, `${new Date().toISOString().replace(/[:.]/g, '-')}-`));

const sourceHashes = (role, fallbackUrl) => {
  const sources = new Map();
  for (const block of role.evidence) {
    const url = block.sourceUrl ?? fallbackUrl;
    const key = JSON.stringify([block.source, url]);
    const entry = sources.get(key) ?? { kind: block.source, url, blocks: [] };
    entry.blocks.push({ id: block.id, text: block.text, kind: block.kind, locator: block.locator });
    sources.set(key, entry);
  }
  return [...sources.values()].map(({ blocks, ...source }) => ({
    ...source,
    urlSha256: sha256(source.url),
    evidenceSha256: sha256(JSON.stringify(blocks)),
    passages: blocks.length,
  }));
};

let context;
try {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  if (await popup.locator('#onboarding-done').isVisible()) await popup.locator('#onboarding-done').click();

  const getScan = async job => {
    await job.bringToFront();
    return popup.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active public page');
      return chrome.tabs.sendMessage(tab.id, { type: 'GET_SCAN' });
    });
  };
  const validSnapshot = snapshot => snapshot && ['ready', 'error'].includes(snapshot.state)
    && (snapshot.result === null || (typeof snapshot.result === 'object'
      && (!snapshot.result.role || (Array.isArray(snapshot.result.role.evidence)
        && (!snapshot.result.role.coverage || (Array.isArray(snapshot.result.role.coverage.sources)
          && Array.isArray(snapshot.result.role.coverage.gaps)))))));
  const waitForScan = async job => {
    const deadline = Date.now() + 20_000;
    let snapshot;
    while (Date.now() < deadline) {
      try { snapshot = await getScan(job); } catch {}
      if (validSnapshot(snapshot)) break;
      await job.waitForTimeout(250);
    }
    if (!validSnapshot(snapshot)) throw new Error('scan-timeout');
    if (snapshot.state === 'error') return snapshot;
    // ponytail: two 750 ms stable samples cover the current frame handshake; wait
    // on an exported coordinator-settled state if that lifecycle becomes public.
    let fingerprint = sha256(JSON.stringify([snapshot.result?.url, snapshot.result?.kind,
      snapshot.result?.role?.evidence, snapshot.result?.role?.coverage]));
    let stable = 0;
    const settleDeadline = Date.now() + 5_000;
    while (Date.now() < settleDeadline && stable < 2) {
      await job.waitForTimeout(750);
      const next = await getScan(job);
      if (!validSnapshot(next)) continue;
      if (next.state === 'error') return next;
      const nextFingerprint = sha256(JSON.stringify([next.result?.url, next.result?.kind,
        next.result?.role?.evidence, next.result?.role?.coverage]));
      stable = nextFingerprint === fingerprint ? stable + 1 : 0;
      fingerprint = nextFingerprint;
      snapshot = next;
    }
    return snapshot;
  };

  const cases = [];
  for (let index = 0; index < requestedUrls.length; index++) {
    const requestedUrl = requestedUrls[index];
    const job = await context.newPage();
    let stage = 'navigation';
    let record;
    try {
      await job.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const finalUrl = checkedUrl(job.url());
      stage = 'scan';
      const snapshot = await waitForScan(job);
      const result = snapshot.result;
      const role = result?.role ?? null;
      const layaInput = role ? {
        version: 'laya-policy-v1', title: role.title, employer: role.employer,
        blocks: role.evidence.map(({ id, text, kind }) => ({ id, text, kind })),
      } : null;
      record = {
        formatVersion: 1,
        requestedUrl, requestedUrlSha256: sha256(requestedUrl),
        finalUrl, finalUrlSha256: sha256(finalUrl),
        capturedAt: result?.scannedAt ?? new Date().toISOString(),
        pageKind: result?.kind ?? null,
        extraction: {
          state: snapshot.state,
          completeness: role?.completeness ?? null,
          sources: role?.coverage?.sources ?? [],
          gaps: role?.coverage?.gaps ?? [],
          signals: result?.signals ?? [],
          warnings: result?.warnings ?? [],
        },
        role,
        sourceHashes: role ? sourceHashes(role, finalUrl) : [],
        layaInput,
        layaInputSha256: layaInput ? sha256(JSON.stringify(layaInput)) : null,
      };
    } catch {
      record = {
        formatVersion: 1,
        requestedUrl, requestedUrlSha256: sha256(requestedUrl),
        finalUrl: null, finalUrlSha256: null,
        capturedAt: new Date().toISOString(), pageKind: null,
        extraction: { state: 'error', completeness: null, sources: [], gaps: [], signals: [], warnings: [] },
        error: `${stage}-failed`, role: null, sourceHashes: [], layaInput: null, layaInputSha256: null,
      };
    }
    await job.close();
    const file = `${String(index + 1).padStart(3, '0')}.json`;
    await writeFile(join(runDirectory, file), JSON.stringify(record, null, 2) + '\n');
    cases.push({ file, requestedUrl, finalUrl: record.finalUrl, pageKind: record.pageKind,
      completeness: record.extraction.completeness, layaInputSha256: record.layaInputSha256 });
  }
  await writeFile(join(runDirectory, 'manifest.json'), JSON.stringify({
    formatVersion: 1,
    capturedAt: new Date().toISOString(),
    extensionVersion: extensionManifest.version,
    extensionBuildSha256,
    blankSession: true,
    applicantValuesEntered: false,
    cases,
  }, null, 2) + '\n');
  console.log(runDirectory);
} finally {
  await context?.close();
}
