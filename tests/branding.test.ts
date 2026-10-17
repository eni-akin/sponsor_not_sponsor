import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('extension SVG artwork retains the approved logo-kit paths and colours', () => {
  const artwork = (file: string) => {
    const document = new JSDOM(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), { contentType: 'image/svg+xml' }).window.document;
    return [...document.querySelectorAll('path, rect')].map(shape => ({
      tag: shape.localName,
      geometry: ['d', 'width', 'height', 'rx'].map(name => shape.getAttribute(name)),
      fill: shape.closest('[fill]')?.getAttribute('fill'),
    }));
  };
  for (const [runtime, approved] of [
    ['extension/icons/source.svg', 'design/logo-kit/digital/sns-app-icon.svg'],
    ['extension/icons/source-small.svg', 'design/logo-kit/digital/sns-app-icon-small.svg'],
    ['extension/icons/logo.svg', 'design/logo-kit/digital/sns-horizontal-color.svg'],
  ]) assert.deepEqual(artwork(runtime!), artwork(approved!));
});
