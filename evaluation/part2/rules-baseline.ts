import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { citationErrors } from '../evaluate';
import { interpretJob } from '../../src/interpreter';
import { mainDecision } from '../../src/main-decision';
import type { EvidenceBlock, JobRecord, SponsorshipStatus } from '../../src/types';

type Case = {
  id: string;
  title: string;
  employer: string;
  location: string;
  sourceUrl: string;
  captureUrl: string;
  completeness: { status: 'complete' | 'partial'; note: string };
  evidence: { source: EvidenceBlock['source']; kind: EvidenceBlock['kind']; locator: string; text: string }[];
  expected: { mainDecision: string; sponsorship: SponsorshipStatus; now: SponsorshipStatus; future: SponsorshipStatus; restrictionKinds: string[] };
};

export async function runRulesBaseline(path = new URL('./development.json', import.meta.url)) {
  const corpus = JSON.parse(await readFile(path, 'utf8')) as { cases: Case[] };
  if (!Array.isArray(corpus.cases) || !corpus.cases.length) throw new Error('Development cases are missing.');
  const ids = new Set<string>();
  const results = corpus.cases.map(item => {
    if (ids.has(item.id)) throw new Error(`Duplicate case ID: ${item.id}`);
    ids.add(item.id);
    if (!item.evidence.length || item.evidence.some(block => !block.text || !block.locator)) throw new Error(`Invalid evidence: ${item.id}`);
    const role: JobRecord = {
      key: item.id, title: item.title, employer: item.employer, location: item.location, identifier: null,
      employmentTypes: [], completeness: item.completeness.status === 'complete' ? 'description-found' : 'incomplete',
      evidence: item.evidence.map((block, index) => ({ ...block, id: `${item.id}-${index}`, sourceUrl: item.captureUrl })),
    };
    const result = interpretJob(role);
    const actual = {
      mainDecision: mainDecision(role, result).status,
      sponsorship: result.sponsorship.status,
      now: result.sponsorshipByTiming.now.status,
      future: result.sponsorshipByTiming.future.status,
      restrictionKinds: [...new Set(result.restrictions.map(restriction => restriction.kind))].sort(),
    };
    const expected = { ...item.expected, restrictionKinds: [...item.expected.restrictionKinds].sort() };
    return {
      id: item.id,
      expected,
      actual,
      fieldMatches: Object.fromEntries(Object.keys(expected).map(key => [key,
        JSON.stringify(actual[key as keyof typeof actual]) === JSON.stringify(expected[key as keyof typeof expected])])),
      citationErrors: citationErrors(role, result),
      restrictions: result.restrictions,
    };
  });
  const definitive = results.filter(result => ['available', 'unavailable'].includes(result.actual.sponsorship));
  const expectedDefinitive = results.filter(result => ['available', 'unavailable'].includes(result.expected.sponsorship));
  const correctDefinitive = definitive.filter(result => result.actual.sponsorship === result.expected.sponsorship).length;
  return {
    provenance: 'Current local deterministic interpreter against evaluation/part2/development.json. Provisional labels; four cases only; not an accuracy estimate.',
    count: results.length,
    sponsorship: {
      definitivePredictions: definitive.length,
      correctDefinitive,
      precision: definitive.length ? correctDefinitive / definitive.length : null,
      expectedDefinitive: expectedDefinitive.length,
      recall: expectedDefinitive.length ? correctDefinitive / expectedDefinitive.length : null,
      abstentions: results.filter(result => result.actual.sponsorship === 'unclear').length,
    },
    restrictionKindMatches: results.filter(result => result.fieldMatches.restrictionKinds).length,
    citationErrorCases: results.filter(result => result.citationErrors.length).length,
    cases: results,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runRulesBaseline(), null, 2));
}
