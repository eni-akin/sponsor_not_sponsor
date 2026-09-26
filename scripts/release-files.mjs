export const staticFiles = [
  'manifest.json', 'popup.html', 'popup.css', 'help.html', 'privacy.html', 'document.css',
  ...[16, 32, 48, 128].map(size => `icons/icon-${size}.png`),
];
export const releaseFiles = [...staticFiles, 'content.js', 'popup.js', 'background.js'].sort();
