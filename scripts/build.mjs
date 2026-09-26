import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { staticFiles } from './release-files.mjs';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/content.ts', 'src/popup.ts', 'src/background.ts'],
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  legalComments: 'none',
  loader: { '.css': 'text' },
});
for (const file of staticFiles) {
  await mkdir(dirname(`dist/${file}`), { recursive: true });
  await copyFile(`extension/${file}`, `dist/${file}`);
}
console.log('Extension built in dist/. Load that folder in chrome://extensions.');
