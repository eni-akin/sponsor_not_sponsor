# Accessibility preflight — October 17, 2026

Scope: the packaged toolbar popup, on-page badge and evidence panel, help page, and privacy page. This is an agent-executable preflight, not the independent human accessibility review required for publication.

## Automated evidence

- [x] Popup controls have programmatic names; Scan again and the evidence disclosure work from the keyboard; action order is preserved; forced-colour focus remains visible.
- [x] Badge and non-modal evidence dialog have accessible names, keyboard activation, Escape close, and focus return. Repositioning preserves focus.
- [x] The panel stays within 320×568, 640×360, and 320×256 viewports without horizontal overflow; its evidence remains reachable. Actual 200% browser zoom also keeps it in view.
- [x] Visible panel actions retain names and at least 24×24 CSS-pixel targets.
- [x] Reduced motion prevents the one-shot badge sweep. Forced colours hide the decorative tracer while retaining visible badge and panel focus.
- [x] Help and privacy expose one main landmark and one level-one heading, reflow without horizontal scrolling at 320 CSS pixels, and retain visible link focus in forced colours.
- [x] The approved foreground/background pairs used for primary actions, supporting text, links, and semantic results meet WCAG AA text contrast (lowest checked pair: white on ember, 4.52:1).
- [x] Application answers remain excluded from scan output and optional reports; local fixture scans make no analysis-service requests.

Run from the repository root:

```sh
pnpm --config.verify-deps-before-run=false check
node scripts/browser-smoke.mjs
node scripts/browser-positioning.mjs
node scripts/store-screenshots.mjs
```

The browser checks use a disposable Chromium profile and fictional local fixtures. They do not inspect the owner's browser profile or establish independent real-world accuracy.

## Human-only publication review

- [ ] Use VoiceOver with Chrome on macOS and NVDA or JAWS with Chrome on Windows. Confirm concise names, reading order, heading/landmark navigation, disclosure state, status announcements, dialog context, and source-link purpose on every surface.
- [ ] Complete each workflow without a pointer: onboarding, rescan, show panel, expand evidence, follow a source, report download, pause/site controls, dismiss/restore, and Escape close. Confirm focus never disappears or lands behind the panel.
- [ ] Inspect the real Chrome toolbar popup and all other surfaces at 200% and 400% zoom, plus large text. Confirm no clipped controls, lost content, or two-dimensional scrolling where reflow is expected.
- [ ] Inspect Windows High Contrast themes and macOS increased contrast. Confirm boundaries, focus, links, disabled states, and result labels remain distinguishable without relying on colour or glow.
- [ ] Enable the operating system's reduced-motion setting and confirm the badge arrives without the perimeter sweep or another unexpected animation.
- [ ] Review at representative narrow/short windows and over real job sites with floating tools. Confirm placement changes do not obscure page actions or disrupt keyboard and screen-reader context.
- [ ] Record browser, operating system, assistive technology/version, reviewer, date, findings, and remediation retest. A signed record is still required before closing the publication gate.

## Remaining limits

Chromium emulation cannot certify native screen-reader announcements, real Windows High Contrast rendering, browser-toolbar focus behavior, or OS-level zoom. The actual-toolbar `scripts/popup-sizing.mjs` check could not run in this session because Chromium reported no active browser window; the October 17 handoff records its earlier successful run. The nine-point placement heuristic can also miss thin overlays; that known limitation is unchanged.
