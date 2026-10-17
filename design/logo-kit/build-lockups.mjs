// Compose deliverables from the hand-drawn masters; no fonts or external SVG references.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(root, 'source');
const digital = path.join(root, 'digital');
const inner = name => {
  const raw = fs.readFileSync(path.join(source, name), 'utf8');
  assert(!/<(?:text|image|script|filter|mask)\b/.test(raw));
  return raw.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/, '').trim();
};
const save = (name, width, body, title, directory = digital) => {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, name), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 256" role="img" aria-labelledby="sns-title"><title id="sns-title">${title}</title>${body}</svg>\n`);
};
const wordmark = inner('sns-wordmark.svg');
const symbol = inner('sns-symbol.svg');
const whiteSymbol = inner('sns-symbol-reversed.svg');
const darkSymbol = inner('sns-symbol-dark.svg');
const tint = (svg, color) => svg.replace(/fill="#[0-9a-f]{6}"/gi, `fill="${color}"`);

for (const [variant, mark, letters] of [
  ['color', symbol, wordmark],
  ['black', tint(symbol, '#000000'), tint(wordmark, '#000000')],
  ['white', whiteSymbol, tint(wordmark, '#FFFFFF')],
  ['dark', darkSymbol, tint(wordmark, '#FFF8F2')],
  ['mono', symbol, tint(wordmark, '#C94F32')],
]) {
  save(`sns-horizontal-${variant}.svg`, 704, `${mark}<g transform="translate(240 0)">${letters}</g>`, `SNS — horizontal ${variant}`);
  save(`sns-stacked-${variant}.svg`, 256, `<g transform="translate(48 0) scale(.625)">${mark}</g><g transform="translate(35.2 160) scale(.4)">${letters}</g>`, `SNS — stacked ${variant}`);
}
save('sns-wordmark-color.svg', 464, wordmark, 'SNS — custom wordmark');
save('sns-wordmark-white.svg', 464, tint(wordmark, '#FFFFFF'), 'SNS — white wordmark');
save('sns-app-icon.svg', 256, `<rect width="256" height="256" rx="56" fill="#29232E"/>${darkSymbol}`, 'SNS — app icon');
save('sns-app-icon-small.svg', 256, `<rect width="256" height="256" rx="56" fill="#29232E"/>${inner('sns-symbol-small-light.svg')}`, 'SNS — small app icon');

// The small favicon stays on a contrasting tile in both browser themes.
save('sns-favicon-source.svg', 256, `<rect width="256" height="256" rx="56" fill="#29232E"/>${inner('sns-symbol-small-light.svg')}`, 'SNS — favicon', source);

const cmyk = hex => {
  const rgb = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255);
  const k = 1 - Math.max(...rgb);
  return [...rgb.map(x => Math.round((1 - x - k) / (1 - k) * 100)), Math.round(k * 100)];
};
const luminance = hex => hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
  .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
  .reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
assert(contrast('#C94F32', '#FFFFFF') >= 4.5);
assert(contrast('#C94F32', '#FFF8F2') >= 3);
assert(contrast('#FFB38C', '#29232E') >= 7);
assert(contrast('#29232E', '#FFF8F2') >= 7);
assert.deepEqual(cmyk('#C94F32'), [0, 61, 75, 21]);
for (const name of fs.readdirSync(digital).filter(x => x.endsWith('.svg'))) {
  const svg = fs.readFileSync(path.join(digital, name), 'utf8');
  assert(!/<(?:text|image|script|filter|mask|use)\b/.test(svg), name);
  assert(svg.includes('<title'), name);
}
console.log('Lockups, app-icon masters, and palette contrast assertions passed.');
