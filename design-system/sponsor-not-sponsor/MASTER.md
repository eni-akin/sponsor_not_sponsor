# SNS interface system — 1.3

All active surfaces use the approved SNS light identity: paper #FFF8F2, ink
#29232E, ember #C94F32, white surfaces, border #DABFB0, muted text #665861,
focus #29232E, success #23613D, warning #735221, danger #963B2F.
System fonts keep interfaces fast and private. Use 4/8/12/16/24/32px spacing,
12–16px card radii, subtle shadows, and visible 3px focus outlines.

Controls have 44px hit areas, separated by 8px. Supporting text is at least
12px in compact extension surfaces and 14px on full pages. Status always has
a text label. Preserve result colours and blocker-first semantics.

Use native details/summary for disclosure, labelled controls, inline field
errors and a focused linked summary after failed submission. Preserve drafts
in tab memory on failures. Do not persist report contents in browser storage.

The receipt handoff stores only reportId and receivedAt in sns.receipt.v1 in
sessionStorage, consumes it once, and expires after 15 minutes. No receipt is
placed in a URL. Clipboard failure leaves selectable receipt text.

Inventory: popup/onboarding/settings; injected badge, evidence panel and local
report controls; extension help/privacy; website home/demo/support/privacy;
public reporting import/explanation/review/challenge; receipt page; private
inbox list, filters, health, pagination, detail, review and deletion controls.

Keep 400px actual Chrome popup sizing, adaptive placement, focus restoration,
short viewport scrolling, reduced motion and forced colours. No external fonts,
UI dependencies, analytics, dark mode or company research activation.
