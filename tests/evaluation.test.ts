import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corpus } from '../evaluation/corpus';
import { citationErrors, ratio, runCase, summarize, validateCorpus } from '../evaluation/evaluate';
import { interpretJob } from '../src/interpreter';
import type { JobRecord } from '../src/types';

test('evaluation corpus has 160 unique cases with disjoint scenario families', () => {
  validateCorpus(corpus);
  assert.equal(corpus.length, 160);
  for (const split of ['development', 'holdout']) {
    const cases = corpus.filter(item => item.split === split);
    assert.equal(cases.length, 80);
    assert.equal(cases.filter(item => item.html !== undefined).length, 16);
  }
  assert.throws(() => validateCorpus([corpus[0]!, corpus[0]!]), /Duplicate/);
  assert.throws(() => validateCorpus([corpus[0]!, { ...corpus[0]!, id: 'other', split: 'holdout' }]), /crosses splits/);
});

test('empty denominators are unavailable, never perfect precision', () => {
  assert.equal(ratio(0, 0).value, null);
  assert.equal(ratio(0, 0).interval95, null);
  assert.ok(ratio(10, 10).interval95![0]! < 1);
});

test('missed jobs reduce coverage and recall; false labels reduce precision', () => {
  const observation = runCase(corpus[0]!);
  const correct = { ...observation, expectedKind: 'job-posting' as const, actualKind: 'job-posting' as const };
  const missed = { ...correct, detected: false, actualKind: 'non-job' as const, actual: { ...correct.actual, sponsorship: 'unclear' as const } };
  const falseLabel = { ...correct, expectedKind: 'non-job' as const, expected: { ...correct.expected, sponsorship: 'unclear' as const } };
  const report = summarize([correct, missed, falseLabel]);
  assert.equal(report.detection.precision.value, .5);
  assert.equal(report.detection.recall.value, .5);
  assert.equal(report.fields.sponsorship!.definitivePrecision.value, .5);
  assert.equal(report.fields.sponsorship!.definitiveRecall.value, .5);
  assert.equal(report.fields.sponsorship!.conclusionCoverage.value, .5);
});

test('citation audit catches invented quotes, wrong sources and missing evidence', () => {
  const role: JobRecord = { key: 'test', title: 'Engineer', employer: null, location: null, identifier: null, employmentTypes: [], completeness: 'description-found', evidence: [{ id: 'e', text: 'Visa sponsorship is available.', source: 'visible-page', kind: 'text', locator: 'p' }] };
  const result = interpretJob(role);
  assert.deepEqual(citationErrors(role, result), []);
  result.sponsorship.citations[0]!.quote = 'An invented quote';
  assert.ok(citationErrors(role, result).length > 0);
  result.sponsorship.citations = [];
  assert.ok(citationErrors(role, result).includes('Policy label without evidence'));
});

test('reviewed engineering policy scenarios remain regressions after exposure', () => {
  // Provisional AI-authored labels, not an independent human accuracy dataset.
  for (const item of corpus.filter(item => !item.deferred)) {
    const observation = runCase(item);
    assert.deepEqual(observation.errors, [], `${item.id}: ${observation.errors.join('; ')}`);
  }
});
