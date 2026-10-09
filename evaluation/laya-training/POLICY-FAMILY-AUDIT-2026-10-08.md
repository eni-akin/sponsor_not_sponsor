# Policy-family audit — October 8, 2026

All 89 captured passages were read: frozen training v1 (39), proposed training (25), proposed calibration (25). The companion `policy-family-audit-2026-10-08.json` pins both input file hashes and the decision-contract hash and assigns every record to a connected policy family. Run `python3 scripts/audit_laya_policy_families.py` to verify the saved audit against current inputs and the reviewed grouping.

The proposed 25-record calibration split is not independent: 19 records contain material templates already present in training. Employer and exact evidence separation do not establish policy-family separation. Review is by agents, not an assertion of new owner approval. Employer edges are included in components, so Cloudflare's export and question passages remain indivisible.

| Shared material template | Calibration IDs to quarantine | Training overlap |
|---|---|---|
| Applicant now/future sponsorship question | 29, 30, 31, 32, 33, 34, 35, 36, 37, 47, 48 | CSC, Empire State, Brave Health, Recovery Village, Royal Electric, Cloudflare question, Belvedere |
| Authorization without now/future sponsorship | 28, 40 | Falcomm, Qvest, Veris; new 3 and 16 |
| Position not eligible for sponsorship | 46 | New 3 and 17; connected through 3 to authorization family |
| Sponsorship available for position/role | 26, 49 | SingleStore |
| Sponsorship not available for position/role | 42 | New 4 and 5 |
| Unable to sponsor or take over employment visa | 39 | Compeer's two refusal passages |
| Sponsor visas for eligible candidates | 50 | New 8, 19, 23, 24, 25 |

Clera and Datadog are conservative exclusions: their whole excerpt repeats a short affirmative template from SingleStore. NEX repeats the whole refusal template from LOOMIS/Sigma. The criterion is repeated material phrasing, not policy outcome. ALKU repeats Compeer's distinctive “take over sponsorship of an employment visa” phrase. Visa-example substitutions in standardized application questions do not make the questions independent.

Internal training families also cover exact Awetomaton and Harrison repeats, GCM's future-authorization repeats, Compeer's CPT/Pre-OPT invitation, citizenship-for-clearance wording, and the identical standalone citizenship sentences. Connected components merge shared clauses transitively: all Compeer invitations stay with its refusal family, and Rational's two clauses connect role-ineligibility with now/future authorization.

The remaining calibration candidates are 27 (Costello), 38 (nCino), 41 (Fiducial), 43 (Optiver), 44 (Think Academy), and 45 (IMC). Costello's OPT consideration/eligibility-criteria condition is materially different from direct ineligibility wording; nCino specifies transfer; Fiducial's emphatic generic refusal shares ordinary vocabulary without a repeated distinctive template; Optiver says supportive; Think Academy states CPT/OPT acceptance. IMC combines a current begin-work question with a distinctive explanatory sentence defining sponsorship examples including F-1 OPT; SkyNRG instead asks about the role's country, and Ekimetrics branches on present authorization status. Its retained status depends on that multi-part structure, not timing alone. Hermeus's future question follows the same template as future-only Belvedere despite appended answer choices, so 34 is quarantined. Their independent status is limited to the supplied excerpts. Six candidates are not an adequate replacement for the intended 25-record calibration corpus without an explicit revised design and coverage review.

Freeze recommendation: preserve frozen v1 unchanged; record the new 25 training passages in a separate immutable blocked candidate snapshot with family assignments. Preserve all owner intended calibration memberships and labels in its candidate snapshot, quarantine the 19 overlaps, and collect replacements. Do not automatically move quarantined calibration into training. Missing official provenance/completeness must be repaired before claiming a verified corpus or training readiness. Collect employer- and family-independent held-out sources before tuning.

Limitations: excerpt-only assessment cannot establish whether omitted context introduces further overlap. A different label or extra clause never proves a passage independent when its material template repeats. No source passages, labels, intended splits, or frozen files were changed.
