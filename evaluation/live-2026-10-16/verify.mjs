import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const directory = new URL("./", import.meta.url);
const data = JSON.parse(await readFile(new URL("results.json", directory), "utf8"));
const casesMarkdown = await readFile(new URL("cases.md", directory), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");

assert.equal(data.cases.length, 30);
assert.equal(new Set(data.cases.map(({ id }) => id)).size, 30);
assert.deepEqual(data.cases.map(({ id }) => id), Array.from({ length: 30 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`));
assert.equal(new Set(data.cases.map(({ sourceUrl }) => sourceUrl)).size, 30);
assert.equal(new Set(data.cases.map(({ finalUrl }) => finalUrl)).size, 30);

for (const record of data.cases) {
  assert.equal(record.evidenceFile, `evidence/${record.id}.md`);
  assert.equal(new URL(record.sourceUrl).protocol, "https:");
  assert.equal(new URL(record.finalUrl).protocol, "https:");
  assert.equal(hash(record.sourceUrl), record.sourceLocatorSha256, `${record.id} source URL hash`);
  assert.equal(hash(await readFile(new URL(record.evidenceFile, directory))), record.evidenceSha256, `${record.id} evidence hash`);
  assert.equal([...casesMarkdown.matchAll(new RegExp(`^## ${record.id} —`, "gm"))].length, 1, `${record.id} checkpoint`);
  assert.equal([...casesMarkdown.matchAll(new RegExp(`^Actual ${record.id}\\b`, "gm"))].length, 1, `${record.id} actual observation`);
}

const workdayRequisitions = data.cases
  .filter(({ platform }) => platform === "Workday")
  .map(({ sourceUrl }) => decodeURIComponent(new URL(sourceUrl).pathname).match(/R\d{7,8}/)?.[0]);
assert.ok(workdayRequisitions.every(Boolean));
assert.equal(new Set(workdayRequisitions).size, workdayRequisitions.length);

const undisputed = data.cases.filter(({ goldDisputed }) => !goldDisputed);
const qualityEligible = data.cases.filter(({ qualityEligible }) => qualityEligible);
const matches = (records) => records.filter(({ goldHeadline, actualHeadline }) => goldHeadline === actualHeadline).length;
const trueBlockers = qualityEligible.filter(({ goldHeadline, actualHeadline }) =>
  goldHeadline === "Explicit blocker found" && actualHeadline === goldHeadline).length;
const predictedBlockers = qualityEligible.filter(({ actualHeadline }) => actualHeadline === "Explicit blocker found").length;
const goldBlockers = qualityEligible.filter(({ goldHeadline }) => goldHeadline === "Explicit blocker found").length;

const metrics = {
  total: data.cases.length,
  allInitialGold: { total: data.cases.length, matches: data.cases.filter(({ initialGoldHeadline, actualHeadline }) => initialGoldHeadline === actualHeadline).length },
  allC02Contextual: { total: data.cases.length, matches: data.cases.filter(({ id, goldHeadline, actualHeadline }) =>
    (id === "C02" ? "No blocker found" : goldHeadline) === actualHeadline).length },
  undisputed: { total: undisputed.length, matches: matches(undisputed) },
  undisputedHeadlineAndTitle: {
    total: undisputed.length,
    matches: undisputed.filter(({ goldHeadline, actualHeadline, titleMatch }) => goldHeadline === actualHeadline && titleMatch).length,
  },
  qualityEligible: { total: qualityEligible.length, matches: matches(qualityEligible) },
  supportedScope: {
    total: data.cases.filter(({ supportedScope }) => supportedScope).length,
    matches: data.cases.filter(({ supportedScope, goldHeadline, actualHeadline }) => supportedScope && goldHeadline === actualHeadline).length,
  },
  supplementalSameVacancy: {
    total: undisputed.length,
    matches: undisputed.filter(({ goldHeadline, supplementalSameVacancyGold, actualHeadline }) =>
      (supplementalSameVacancyGold ?? goldHeadline) === actualHeadline).length,
  },
  blockers: {
    truePositive: trueBlockers,
    falsePositive: predictedBlockers - trueBlockers,
    falseNegative: goldBlockers - trueBlockers,
    precision: predictedBlockers ? trueBlockers / predictedBlockers : null,
    recall: goldBlockers ? trueBlockers / goldBlockers : null,
  },
  coverage: {
    complete: data.cases.filter(({ descriptionCompleteUI }) => descriptionCompleteUI).length,
    failures: data.cases.filter(({ coverageFailure }) => coverageFailure).length,
  },
  identity: {
    title: data.cases.filter(({ titleMatch }) => titleMatch).length,
    employer: data.cases.filter(({ employerMatch }) => employerMatch).length,
    strict: data.cases.filter(({ titleMatch, employerMatch }) => titleMatch && employerMatch).length,
  },
  citations: {
    citedDecisions: data.cases.filter(({ mainQuoteCount }) => mainQuoteCount > 0).length,
    sourceBound: data.cases.filter(({ mainQuoteCount, mainCitationsSourceBound }) => mainQuoteCount > 0 && mainCitationsSourceBound).length,
    semanticallyComplete: data.cases.filter(({ mainQuoteCount, mainEvidenceSemanticCompleteness }) =>
      mainQuoteCount > 0 && mainEvidenceSemanticCompleteness === "complete").length,
    semanticallyPartial: data.cases.filter(({ mainQuoteCount, mainEvidenceSemanticCompleteness }) =>
      mainQuoteCount > 0 && mainEvidenceSemanticCompleteness === "partial").length,
  },
};

assert.deepEqual(metrics, {
  total: 30,
  allInitialGold: { total: 30, matches: 23 },
  allC02Contextual: { total: 30, matches: 24 },
  undisputed: { total: 29, matches: 23 },
  undisputedHeadlineAndTitle: { total: 29, matches: 22 },
  qualityEligible: { total: 27, matches: 22 },
  supportedScope: { total: 19, matches: 18 },
  supplementalSameVacancy: { total: 29, matches: 21 },
  blockers: { truePositive: 10, falsePositive: 0, falseNegative: 5, precision: 1, recall: 2 / 3 },
  coverage: { complete: 29, failures: 1 },
  identity: { title: 29, employer: 13, strict: 13 },
  citations: { citedDecisions: 10, sourceBound: 10, semanticallyComplete: 6, semanticallyPartial: 4 },
});

console.log(JSON.stringify(metrics, null, 2));
