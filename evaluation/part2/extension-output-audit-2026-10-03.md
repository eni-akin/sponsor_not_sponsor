# Extension output audit — October 3, 2026

Source file: `table-87d72307-a870-4823-b227-c7634568035a.xlsx - Sheet1 (1).csv`  
SHA-256: `515476c759466c9257354c0685b28cc07fe5d9c38931c84fdd9ab200684d9f7c`  
Rows: 54

This corrected export supersedes SHA-256 `bc221c4e716817f907cb7140bac224118ab9179b058b6d4f249e2a156f16b711`. Only the `More detail` cells for rows 1, 31, and 33 changed; result counts and other fields are unchanged.

This audit preserves the submitted output as evidence. It does not treat the results as a final holdout score because the human labels are not frozen and the CSV includes development, exposed, and out-of-scope cases.

## Submitted output summary

| Measure | Count |
| --- | ---: |
| Explicit blocker found | 18 |
| No blocker found | 31 |
| Could not verify | 4 |
| Unable to identify the role | 1 |
| Employer identified | 46 of 54 |
| Employer missing or blank | 8 of 54 |
| Description recorded as fully extracted | 48 of 54 |
| Application-only or partial | 2 of 54 |
| Description missing or blank | 4 of 54 |

## Rescan verification

The three previously contaminated rows now agree internally:

| Row | Case | Problem |
| ---: | --- | --- |
| 1 | Waymo | `Explicit blocker found` now cites the country-scoped export-license condition, deadline, and exceptions. |
| 31 | Amgen | Result and detail both say `No blocker found`; the page reports that non-unique structured data was ignored. |
| 33 | Zipline | Result and detail both say `No blocker found`; the description was read from a visible embedded frame. |

No result-column/detail mismatch remains in the corrected 54 rows.

## Provisional comparison

The comparison below uses the 46 unseen U.S. cases retained by `holdout-submission-audit.md` and its evidence-contract corrections. It excludes the four development cases, Pinterest, Southwest, Google U.K., and Tradeweb London. It remains provisional until a human freezes the labels.

| Measure | Provisional result |
| --- | ---: |
| Expected explicit blockers | 22 |
| Explicit blockers detected | 13 |
| False blockers | 0 |
| Blocker precision | 100.0% (13/13) |
| Blocker recall | 59.1% (13/22) |
| Expected blockers returned as `No blocker found` | 8 |
| Expected blocker returned as `Could not verify` | 1 |
| Coverage failures (`Could not verify` or unreadable) | 4 of 46 |

The current rules preserve high blocker precision in this sample but miss too many blockers to meet the proposed 90% recall gate.

### Missed explicit blockers

| Case | Submitted output | Reviewed evidence type |
| --- | --- | --- |
| Vanguard 182781 | No blocker found | Explicit visa-sponsorship denial |
| Elevance Health JR209081 | No blocker found | Must work without future visa sponsorship |
| CACI 333037 | No blocker found | Must work without employer sponsorship now or later |
| SAS 42964 | No blocker found | Must not require sponsorship now or later |
| Zipline 7991435003 | No blocker found | Explicit work-visa refusal |
| Pacific Fusion 4398373009 | No blocker found | Explicit U.S.-person export-control restriction |
| Shure 4956 | No blocker found | Explicit work-visa refusal |
| Publicis Groupe 172577 | No blocker found | Explicit present/future sponsorship refusal |
| RF-SMART 5407206008 | Could not verify | Explicit employer refusal exists, but the description was not extracted |

### Other non-matching outcomes

- Mindex and Epic Games returned `Could not verify` because the description was unavailable; Demco was not recognized as a role. These are reading failures, not rule false positives.
- Amgen should retain its conditional, future-FTE sponsorship wording instead of becoming a current blocker. The corrected output misses that statement after ignoring non-unique structured data.
- Saronic still needs a human evidence decision: the submitted review quotes a U.S.-person definition but not the sentence making that status mandatory.
- Immuta is marked “application form only” but received a definitive `No blocker found`. Recheck whether a matching overview was recovered; otherwise it should be `Could not verify`.

## Failure clusters for the next fixes

1. **Structured Workday text:** Vanguard, Elevance, and CACI show complete recovered descriptions but miss common explicit refusal wording.
2. **iCIMS text:** SAS and Shure show complete descriptions but miss explicit sponsorship refusals.
3. **Export-control wording:** Pacific Fusion's explicit U.S.-person condition is missed.
4. **Page reading:** Mindex, RF-SMART, Epic Games, and Demco do not provide a complete scannable role.
5. **Employer extraction:** Electronic Arts, Mindex, Google, Veeam, Amazon, Epic Games, Collier Aerospace, and Demco lack an employer value.

## Holdout status

**Not final.** The CSV does not include the four blind additions—Northrop Grumman, MFS, Invesco, and HMH—selected to replace excluded rows. Freeze human-reviewed labels and test those four additions before using this as the rules-versus-Laya comparison set.

No Laya comparison or rule changes were performed from this output.
