# Part 2 baseline

Recorded October 2, 2026. Commit: `8128aa804bf2ce1600dc455460218838ef23a855`.
Extension/package version: `0.6.0`.

The only pre-existing working-tree addition was `IMPROVEMENT_PLAN_PART_2.md`; it is preserved.

## Verification

To avoid concurrent agent edits contaminating the baseline, the committed tree was extracted into a temporary directory and checked with the existing installed dependencies.

- `node --import tsx --test tests/*.test.ts`: 194 passed, zero failures.
- Installed TypeScript compiler, `--noEmit`: passed.
- `node scripts/build.mjs`: passed.
- No fresh baseline browser or model-quality claim is made here. Historical browser checks and Laya results remain in their existing reports.

## Known failures and expected changes

| Reproduction | Baseline limitation | Expected behavior |
| --- | --- | --- |
| Parent posting plus matching application iframe | Parent role prevents frame evidence supplementation. | Add only public passages tied to the same verified vacancy, preserving source identity. |
| Job iframe alongside a visible unrelated widget | Multiple visible frames prevent identification. | Identify each window securely; never accept an early reply while another potentially relevant frame remains unresolved. |
| Delayed/replaced/navigating frame; pause/site disable | Lifecycle browser coverage incomplete. | Invalidate stale evidence and refresh current verified documents; stop while disabled. |
| Visible iframe in recognized posting | Generic unsupported-form warning. | Explain remaining unread coverage accurately. |
| Waymo 8248060 export licensing policy | `require` plus `citizenship` becomes a generic citizenship blocker; scope and exceptions omitted. | Informational notices remain context; explicit licensing obstacles retain affected group, deadline, exemptions, and exact citations. |
| Laya development probes | Existing configuration has no demonstrated useful quality advantage. | Evaluate separately against reviewed expectations; keep experimental unless acceptance gates are met. |

Prior diagnostic probes and inspected live jobs are development material, not untouched holdout data. Source discovery and agent-proposed labels do not constitute independent human review.
