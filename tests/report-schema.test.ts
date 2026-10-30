import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_REPORT_BYTES, parseReportSubmission } from '../shared/report-schema';
import { interpretJob } from '../src/interpreter';
import type { JobRecord } from '../src/types';

const valid = () => ({
  schemaVersion: 1,
  noticeVersion: '2026-10-30',
  submissionKey: 'retry-123',
  turnstileToken: 'test-token',
  category: 'sponsorship',
  expectedOutcome: 'Explicit blocker found',
  explanation: 'The displayed result does not match the quoted policy.',
  relevantPassage: 'We cannot sponsor this position.',
  email: 'reporter@example.com',
  posting: { url: 'https://user:secret@example.com/jobs/1?candidate=private#application', title: 'Engineer' },
  diagnostic: {
    formatVersion: 2,
    extensionVersion: '1.0.1',
    createdAt: '2026-10-27T12:00:00Z',
    scannedAt: '2026-10-27T11:59:00Z',
    pageKind: 'job-posting',
    displayedDecision: { status: 'no-blocker', label: 'No blocker found', explanation: 'No explicit blocker was found.' },
    warnings: [],
  },
});

test('submission contract returns only allowed bounded fields and sanitizes the posting URL', () => {
  const result = parseReportSubmission(valid());
  assert.equal(result.posting.url, 'https://example.com/jobs/1');
  assert.equal(result.diagnostic?.displayedDecision?.label, 'No blocker found');
});

test('submission contract rejects unknown and admin-controlled fields', () => {
  assert.throws(() => parseReportSubmission({ ...valid(), noticeVersion: '2026-10-27' }), /current privacy notice/);
  assert.throws(() => parseReportSubmission({ ...valid(), status: 'closed' }), /status is not allowed/);
  assert.throws(() => parseReportSubmission({ ...valid(), posting: { ...valid().posting, issueUrl: 'https://example.com' } }), /issueUrl is not allowed/);
});

test('submission contract rejects unsafe URLs, invalid nested values, and oversized requests', () => {
  assert.throws(() => parseReportSubmission({ ...valid(), posting: { url: 'file:///private/report' } }), /HTTP or HTTPS/);
  assert.throws(() => parseReportSubmission({ ...valid(), diagnostic: { ...valid().diagnostic, warnings: Array(21).fill('warning') } }), /at most 20/);
  assert.throws(() => parseReportSubmission(valid(), MAX_REPORT_BYTES + 1), /byte limit/);
});

test('real-shaped findings preserve independent restrictions and sanitize every citation',()=>{
  const role:JobRecord={key:'test',title:'Engineer',employer:'Fictional',location:'US',identifier:null,employmentTypes:[],completeness:'description-found',evidence:[{id:'e1',source:'visible-page',kind:'text',text:'We cannot provide visa sponsorship. OPT candidates are eligible.',locator:'p',sourceUrl:'https://user:password@example.com/jobs/1?secret=yes#private'}]};
  const findings=interpretJob(role);
  const result=parseReportSubmission({...valid(),diagnostic:{...valid().diagnostic,findings}});
  assert.doesNotMatch(JSON.stringify(result),/password|secret=yes|#private/);
  assert.match(JSON.stringify(result.diagnostic?.findings),/unavailable/);
  assert.match(JSON.stringify(result.diagnostic?.findings),/explicitly-accepted/);
  assert.throws(()=>parseReportSubmission({...valid(),diagnostic:{...valid().diagnostic,findings:{...findings,settings:{private:true}}}}),/not allowed/);
  findings.sponsorship.citations[0]!.quote='x'.repeat(4001);
  assert.throws(()=>parseReportSubmission({...valid(),diagnostic:{...valid().diagnostic,findings}}),/4000/);
});
