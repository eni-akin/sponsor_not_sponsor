# Passage-level training additions and held-out review — October 9, 2026

Status: agent-reviewed; independent coordinator approval and operational split lock are still required. No weights were trained or selected by this collection agent.

`reviewed-collection.json` contains five training passages and twelve test passages. `train-additions.json` and `heldout-reviewed.json` are the same records separated by intended split.

## Before-lock reassignment

CertiK's conditional policy and both HASI passages were only proposed test candidates, never frozen or evaluated. The coordinator authorized assigning them to training before locking any test. All CertiK and HASI examples are removed from the proposed test. Four role-specific conditional training examples now come from CertiK, HASI, Inferact and SW Law Group. HASI's separate refusal of new H-1B sponsorship also stays in training. Its existing-H1B transfer exception is not contradicted by the separate new-H1B refusal.

Cartesia was considered but not used: its general company footer does not establish the individual role's sponsorship eligibility strongly enough to resolve the role-conditional coverage gap.

## Source and overlap checks

Discovery searches were broad: no site, domain or platform filters. Exact target text was checked against official source content independently of the discovery method.

All fifteen original candidate source-file hashes and evidence hashes matched; their exact text was found in decoded saved HTML. Inferact's named-role HTML and SW Law Group's dedicated Japanese Bilingual Office Assistant advertisement were fetched live and the exact sentences verified. Their live HTTP byte hashes are recorded, but full raw responses were not saved; the records declare this explicitly. Inferact's public JSON endpoint returned HTTP 403 and was not used as evidence.

Checks compared candidates against all 39 frozen-v1 records, all 50 earlier submissions and all 58 new submissions, including held records. No target matches a complete normalized input passage, and no test employer is in those inputs. Test is also employer-disjoint from the fresh training additions. The longest contiguous shared sequence for any test passage is eight ordinary industry words; the manual review found no substantive copied policy template. A short phrase, topic or label category is not itself a policy family. Archer and Diligent's related selective-position statements stay together in test; both DEFCON targets also stay together.

An assert-based read-only check passed for all 17 IDs, five canonical label fields, evidence hashes, 15 saved-source hashes and literal extracts, fresh-employer separation, whole-text deduplication and four role-conditional training labels. `git diff --check` passed.

## Evaluation limits

This is a twelve-passage test across eleven employer groups, not a vacancy-level evaluation. Employer/job-title metadata and neighboring passages are not model inputs. Raw source captures do not prove full rendered/scanner coverage; no silence headline is asserted.

The test lacks future-only refusal, historical, other-role, none, CPT acceptance, and vacancy-level silence/conflict cases. A single conditional example and this small sample cannot establish production readiness. It can support one honest locked passage-only comparison after training and calibration settings are fixed. Neither collection nor source review authorizes promotion.
