import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'site');
const pages = ['index.html', 'privacy.html', 'support.html', 'demo.html'];
const text = Object.fromEntries(await Promise.all(pages.map(async file => [file, await readFile(resolve(root, file), 'utf8')])));

for (const [file, html] of Object.entries(text)) {
  assert.match(html, /<html lang="en">/, `${file}: language missing`);
  assert.match(html, /name="viewport"/, `${file}: viewport missing`);
  assert.match(html, /<title>[^<]+<\/title>/, `${file}: title missing`);
  for (const href of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(?:https?:|mailto:)/.test(href[1])) continue;
    await access(resolve(root, href[1]));
  }
}

for (const phrase of ['visible job-posting text', 'embedded frames', 'Chrome local storage', 'Ashby', 'Nothing is automatically submitted', 'Limited Use requirements']) {
  assert.ok(text['privacy.html'].includes(phrase), `privacy.html: missing ${phrase}`);
}
assert.ok(text['demo.html'].includes('Visa sponsorship is not available for this position.'), 'demo.html: stable blocker wording changed');
assert.ok(text['demo.html'].includes('This is not a real vacancy or employer.'), 'demo.html: fictional label missing');

const placeholders = Object.values(text).some(html => html.includes('OWNER_INPUT_REQUIRED:'));
if (process.argv.includes('--release')) assert.equal(placeholders, false, 'replace all OWNER_INPUT_REQUIRED values before deployment');
else assert.equal(placeholders, true, 'template should keep owner inputs explicit until supplied');

console.log(`Public-site validation passed (${process.argv.includes('--release') ? 'release' : 'template'} mode).`);
