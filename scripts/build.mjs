import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/content.ts', 'src/popup.ts'],
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  legalComments: 'none',
  loader: { '.css': 'text' },
});
for (const file of ['manifest.json', 'popup.html', 'popup.css']) {
  await copyFile(`extension/${file}`, `dist/${file}`);
}
console.log('Extension built in dist/. Load that folder in chrome://extensions.');
