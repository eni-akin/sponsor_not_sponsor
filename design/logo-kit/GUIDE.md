# SNS — Between logo kit

Direction C (“Between”), its palette, and the SNS kit were approved by the project owner and integrated into the extension and root README on October 16, 2026. [Overview](overview.png) · [Presentation](presentation.html) · [README preview](README-preview.md). The overview/presentation preserve the design-review stage; current integration status and checks are recorded in [CHECKS.md](CHECKS.md).

## Idea and versions

Two opposing quotation forms leave an open centre: a compact identifier for reading what a posting actually says, not an approval seal. Both pieces always share a colour. The brand must not imply official immigration approval or guaranteed sponsorship.

| Use | Artwork |
| --- | --- |
| README / light background | [Horizontal colour SVG](digital/sns-horizontal-color.svg) |
| README / dark background | [Horizontal dark SVG](digital/sns-horizontal-dark.svg) |
| Square layout | [Stacked colour SVG](digital/sns-stacked-color.svg) or [dark SVG](digital/sns-stacked-dark.svg) |
| Standalone mark | [Ember master](source/sns-symbol.svg), [apricot dark master](source/sns-symbol-dark.svg) |
| One colour | [Black](digital/sns-symbol-black.svg), [ink](digital/sns-symbol-mono-29232e.svg), [optically thinned white](digital/sns-symbol-white.svg) |
| Wordmark alone | [Custom SNS](digital/sns-wordmark-color.svg), [white](digital/sns-wordmark-white.svg) |
| Chrome toolbar | `chrome/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` |
| Web icons | `web/favicon.svg`, `favicon.ico`, touch/PWA PNGs, sample manifest and head snippet |

Use `small` masters at 16–24 px: their cuts are simplified and weight increased. Chrome exports use this cut at 16/32 px because the symbol is inset in a tile; 48/128 px use the detailed mark. The 128 px Chrome Web Store export centres the 96 px tile with 16 px of transparent padding on every side; smaller runtime icons retain their full canvas for toolbar legibility. Horizontal and stacked black, white, and ember-mono lockups are also included. The 1024 px app icon uses the detailed mark. Raster exports are RGB PNG; SVG is the editable master format.

## Space and size

Let **u** equal the main symbol's 40-unit band width on its 256-unit canvas. Keep at least 1u of empty space outside the visible artwork. Embedded SVG padding is not the whole clear-space zone. In the horizontal lockup the mark-to-letter gap is 48 units; preserve the supplied proportions.

Minimum screen sizes: small symbol 16 px; regular symbol 32 px; horizontal lockup 112 px wide; stacked lockup 80 px wide; wordmark alone 64 px wide. Below those lockup sizes, use the symbol. For the README, 280 px wide is comfortable. Do not squeeze initials into the Chrome icon.

## Palette

| Name | HEX | RGB | Approximate CMYK (%) | Role |
| --- | --- | --- | --- | --- |
| Ember | #C94F32 | 201, 79, 50 | 0, 61, 75, 21 | Mark on white / paper |
| Ink | #29232E | 41, 35, 46 | 11, 24, 0, 82 | Wordmark, dark tile, normal text |
| Apricot | #FFB38C | 255, 179, 140 | 0, 30, 45, 0 | Light mark on dark backgrounds |
| Paper | #FFF8F2 | 255, 248, 242 | 0, 3, 5, 0 | Warm light surface / dark-mode wordmark |

Ember on white: **4.52:1**; ember on paper: **4.29:1**; apricot on ink: **8.79:1**; ink on paper: **14.53:1**. Ember on paper is suitable for the logo, not small body text requiring 4.5:1. Use ink for body text. Use the dark lockup or white version on ink; never apricot on white. These are brand colours, not sponsorship-result colours, and must not silently recolour the extension's decision badges.

Ember is the recommendation: warm and lively without Duolingo's green. Violet and teal alternatives are presented separately in `color-studies/`; they are not part of this delivery palette. CMYK values are simple conversions, not profile-managed proofs. No Pantone match is claimed: verify against a physical swatch guide if print is ever commissioned. Digital use is the agreed scope.

### Extension UI

Applied October 17, 2026: paper page/panel backgrounds, white cards, ink text/focus rings, and ember primary buttons with white labels. Hover and links use deeper ember `#B4432A`; secondary buttons use `#F5E8DF` with ink text and `#EAD6C8` on hover. Muted text is `#6F6470`. These supporting tones extend the palette without changing sponsorship-result colours or warning states.

Contrast: primary buttons 4.52:1, primary hover 5.56:1, secondary buttons 12.73:1, muted text on paper 5.35:1, links on paper 5.28:1, and ink focus outlines on paper 14.53:1. Disabled controls retain their existing inactive treatment. The interface remains light-themed; no new dark-mode UI or layout was introduced.

## Typography and care

The SNS wordmark is custom filled vector artwork, not an installed font. Its S terminals echo the mark's 45-degree cuts; rounded bends soften the initials. Do not recreate it by typing SNS, stretch it, rotate it, change letter spacing, add gradients/shadows/outlines, split the two symbol pieces into different colours, or put it on a busy photo without a contrasting tile.

No third-party font is embedded or distributed. Supporting presentation text uses the system font stack (`system-ui`, platform sans-serif fallback); keep the project's existing interface typography. This kit introduces no font dependency or font licence requirement for the outlined logo artwork.

## Handover and open checks

The logo-design workflow supplied the geometry, optical-size and reversed adjustments, variant exports, reference comparisons, and presentation structure. The main symbol keeps the approved silhouette. Reversed bands are 38 rather than 40 units; small light bands are 44 rather than the small dark cut's 48 units. The central gap is intentional, not an incomplete ring.

SVG structure, palette assertions, PNG dimensions and transparency, and rendered size/theme/lockup checks are recorded in [CHECKS.md](CHECKS.md). Recompose lockups with `node design/logo-kit/build-lockups.mjs` from the project root; it reads the editable source masters and asserts contrast. Remaining raster/web exports were generated with the installed logo-design skill's rendering/export tools.

Presentation mockups are illustrative layouts, not live deployments or evidence of website, social-handle, domain ownership, or test certification. The web manifest/head snippet assumes deployment at a website root; adjust URLs for a subdirectory. It is not a Chrome extension manifest.

Before public launch: complete trademark and reverse-image searches and obtain any needed legal clearance. No legal clearance, independent recognition study, print/Pantone proof, or installed-Chrome integration test is claimed. No PDF/AI/EPS print package is included for this digital-only brief.
