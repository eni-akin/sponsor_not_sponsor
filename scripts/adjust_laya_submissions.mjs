// Reviewed October 9 submission copies; never modifies originals or frozen corpora.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'evaluation/laya-training/adjusted-submissions-2026-10-09');
const fields = ['scope', 'sponsorship', 'timing', 'cpt', 'opt'];
const choices = [
  ['role', 'question', 'historical', 'company', 'other-role', 'none'],
  ['available', 'unavailable', 'conditional', 'unclear'],
  ['now', 'future', 'now-and-future', 'unspecified'],
  ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
  ['explicitly-accepted', 'explicitly-excluded', 'unclear'],
];
const aliases = {
  'role-specific': 'role', 'company policy': 'company', 'company-wide': 'company',
  'applicant question': 'question', refusal: 'unavailable', question: 'unclear',
  'general statement': 'unclear', 'available (conditional)': 'conditional',
  'refusal (citizenship restriction)': 'unclear', 'now-only': 'now',
  'now and future': 'now-and-future', accepted: 'explicitly-accepted',
  excluded: 'explicitly-excluded', 'not accepted': 'explicitly-excluded',
};
const inputs = [
  { split: 'train', file: '/Users/eniola/Downloads/training_sponsorship_records.csv', count: 20,
    sha256: 'b6090c099bbffaf781e3f61896450774cc14edc1203885069438059c743d2869' },
  { split: 'calibration', file: '/Users/eniola/Downloads/sponsorship_records_calibration.csv', count: 38,
    sha256: 'de8bd3e5885d3fb9876f265d43816daa5fe840e217be7a3d16717b25ad61c682' },
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const norm = value => value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
const nonRole = { sponsorship: 'unclear', timing: 'unspecified', cpt: 'unclear', opt: 'unclear' };
const excluded = { cpt: 'explicitly-excluded', opt: 'explicitly-excluded' };
const crossSplit = new Map([[1,13], [3,9], [4,12], [5,15], [6,17], [7,16], [8,20], [10,19], [28,9], [30,18]]);

function adjust(source, split) {
  const n = Number(source.record);
  assert(Number.isInteger(n) && n > 0, 'Invalid source record number');
  assert.equal(source.intended_split, split, 'Submitted split drift');
  const labels = Object.fromEntries(fields.map((f, i) => {
    const v = source[f];
    assert(typeof v === 'string' && v.trim(), `Missing ${f}`);
    return [f, v === 'not stated' ? (i === 2 ? 'unspecified' : 'unclear') : (aliases[v] ?? v)];
  }));
  const notes = [];
  const set = (values, reason) => { Object.assign(labels, values); notes.push(reason); };
  if (labels.scope !== 'role') set(nonRole, 'Non-role evidence does not establish policy for this vacancy.');
  if ((split === 'train' && n === 12) || (split === 'calibration' && n === 4))
    set(excluded, 'Immigration-support refusal explicitly includes CPT and OPT.');
  if ((split === 'train' && n === 16) || (split === 'calibration' && n === 7))
    set(excluded, 'The vacancy directly excludes CPT and OPT holders.');
  if (split === 'train' && n === 18)
    set({ sponsorship: 'unclear' }, 'CPT/OPT acceptance alone does not establish visa sponsorship.');
  if ((split === 'train' && n === 20) || (split === 'calibration' && n === 8))
    set({ cpt: 'unclear', opt: 'unclear' }, 'Alternative long-term status exception prevents unconditional program exclusion.');
  if (split === 'calibration') {
    if ([9,32].includes(n)) set({ timing: 'unspecified' }, 'Current/future timing is not explicitly stated.');
    if ([12,13,24,37].includes(n)) set({ sponsorship: 'unclear' }, 'Citizenship/clearance restriction is not a sponsorship refusal.');
    if (n === 25) set({ sponsorship: 'unavailable', timing: 'future' }, 'Future visa-sponsorship ineligibility is explicit; current visa-holder restriction is separate.');
    if ([29,31].includes(n)) set({ sponsorship: 'unclear' }, 'Status eligibility does not establish visa sponsorship or its refusal.');
    if (n === 33) set({ sponsorship: 'unclear', cpt: 'unclear' }, 'CPT I in a phlebotomist qualification is not established as immigration CPT.');
    if ([18,20,22].includes(n)) set({ sponsorship: 'unclear' }, 'May be available/eligible is ambiguous; no stated provision condition is established.');
    if (n === 17) set({ sponsorship: 'conditional' }, 'Sponsorship efforts depend on eligibility and an employment offer.');
    if (n === 23) set({ scope: 'historical', ...nonRole }, 'Track record describes past activity and expressly disclaims this vacancy.');
    if (n === 36) notes.push('Conditional employment offer is not conditional immigration sponsorship.');
    if (n === 38) notes.push('Submitted needs_review=yes resolved by coordinator: the text explicitly refuses sponsorship for this role.');
  }
  fields.forEach((f, i) => assert(choices[i].includes(labels[f]), `Invalid ${f}: ${labels[f]}`));
  let disposition = 'candidate';
  const holdReasons = [];
  const hold = (status, reason) => { disposition = status; holdReasons.push(reason); };
  if (split === 'train' && n === 10)
    hold('needs-review', 'Employer identity: ZipRecruiter identifies a platform, not the confirmed hiring employer.');
  if (split === 'train' && n === 18)
    hold('needs-review', 'Pending earlier-dataset membership: Think Academy is in prior calibration record 44.');
  if (split === 'calibration') {
    if (crossSplit.has(n)) hold('quarantine', `Cross-split employer/evidence overlap with new training record ${crossSplit.get(n)}; intended split retained.`);
    if (n === 32) hold('quarantine', 'Duplicate of calibration record 9; keep one identical passage.');
    if ([12,24].includes(n)) hold('needs-review', 'Pending earlier-dataset membership: Boeing is in prior training record 22.');
    if ([18,20,22].includes(n)) hold('needs-review', 'Semantic review: confirm how the modal offer should be labeled.');
    if ([31,37].includes(n)) hold('needs-review', 'Employer identity: submitted name identifies a platform, not the confirmed hiring employer.');
    if (n === 33) hold('needs-review', 'Semantic review: establish whether CPT I refers to immigration authorization.');
  }
  const employer = source.employer;
  let employerGroup = norm(employer);
  if (["state of illinois", "illinois department of natural resources", "illinois department of commerce and economic opportunity"].includes(employerGroup)) employerGroup = 'state of illinois';
  if (employerGroup === 'think academy us') employerGroup = 'think academy';
  if (employerGroup === 'vonsexternal (albertsons)') employerGroup = 'albertsons';
  if (employerGroup === 'boyd (eaton subsidiary)') employerGroup = 'eaton corporation';
  const policyFamily = ['HCA Healthcare', 'Centerpoint Medical Center'].includes(employer) ? 'hca-qualified-student-eb3-opt-cpt' : employerGroup;
  return {
    id: `submission-2026-10-09-${split}-${String(n).padStart(3, '0')}`,
    sourceRecord: source.record, intendedSplit: split, split: null,
    employer, employerGroup, policyFamily, jobTitle: source.job_title, text: source.text,
    ...labels, evidenceSha256: hash(source.text), disposition, holdReasons,
    submittedLabels: Object.fromEntries(fields.map(f => [f, source[f]])),
    submittedNeedsReview: source.needs_review ?? '', needsReview: disposition === 'needs-review',
    reviewer: 'assistant-coordinator', reviewedAt: '2026-10-09', reviewState: 'assistant-reviewed-candidate',
    corrections: fields.filter(f => source[f] !== labels[f]).map(f => ({ field: f, submitted: source[f], corrected: labels[f] })),
    reviewNotes: notes,
  };
}

function verify(records) {
  assert.equal(records.length, 58);
  assert.equal(new Set(records.map(r => r.id)).size, 58);
  for (const r of records) {
    fields.forEach((f, i) => assert(choices[i].includes(r[f])));
    assert.equal(hash(r.text), r.evidenceSha256);
    assert.equal(r.split, null);
    if (r.scope !== 'role') assert.deepEqual(Object.fromEntries(Object.keys(nonRole).map(f => [f, r[f]])), nonRole);
    assert(r.disposition === 'candidate' ? r.holdReasons.length === 0 : r.holdReasons.length > 0);
  }
  const train = records.filter(r => r.intendedSplit === 'train' && r.disposition === 'candidate');
  const calibration = records.filter(r => r.intendedSplit === 'calibration' && r.disposition === 'candidate');
  for (const c of calibration) {
    assert(!train.some(t => t.employerGroup === c.employerGroup || t.policyFamily === c.policyFamily || norm(t.text) === norm(c.text)), 'Split leakage');
  }
  assert.equal(new Set(calibration.map(r => norm(r.text))).size, calibration.length, 'Duplicate calibration evidence');
  assert.equal(train.length, 18); assert.equal(calibration.length, 19);
}

async function main() {
  assert(process.env.LAYA_ARTIFACT_MODULE, 'Set LAYA_ARTIFACT_MODULE to the bundled artifact-tool module.');
  const { Workbook } = await import(process.env.LAYA_ARTIFACT_MODULE);
  const records = [];
  const sources = [];
  for (const input of inputs) {
    const bytes = await fs.readFile(input.file);
    assert.equal(hash(bytes), input.sha256, 'Source CSV changed since review');
    const wb = await Workbook.fromCSV(bytes.toString('utf8'), { sheetName: 'Records' });
    const [headers, ...rows] = wb.worksheets.getItemAt(0).getUsedRange().values;
    assert.equal(rows.length, input.count);
    rows.forEach((values, i) => {
      const source = Object.fromEntries(headers.map((h, col) => [h, values[col] ?? '']));
      assert.equal(source.record, String(i + 1), 'Source order/ID drift');
      for (const f of ['employer', 'job_title', 'text']) assert(source[f].trim(), `Missing ${f}`);
      const record = adjust(source, input.split);
      assert.equal(record.text, source.text); records.push(record);
    });
    sources.push({ path: input.file, sha256: input.sha256, records: input.count, intendedSplit: input.split });
  }
  verify(records);
  const before = new Map(await Promise.all([
    'evaluation/laya-training/frozen-expansion-v1/training-corpus-v1.json',
    'evaluation/laya-training/normalized-submissions-2026-10-08.json', 'DECISION_LOGIC.md',
  ].map(async p => [p, hash(await fs.readFile(path.join(root, p)))])));
  // Do not overwrite a previous adjusted version or pretend it is frozen.
  await fs.mkdir(output);
  const csvFiles = [];
  const header = ['id','record','intended_split','employer','job_title','text',...fields,'status','needs_review','review_notes'];
  for (const [name, selected] of [
    ['training-candidates.csv', records.filter(r => r.intendedSplit === 'train' && r.disposition === 'candidate')],
    ['calibration-candidates.csv', records.filter(r => r.intendedSplit === 'calibration' && r.disposition === 'candidate')],
    ['review-required.csv', records.filter(r => r.disposition !== 'candidate')],
  ]) {
    const matrix = [header, ...selected.map(r => [r.id,r.sourceRecord,r.intendedSplit,r.employer,r.jobTitle,r.text,...fields.map(f => r[f]),r.disposition,r.needsReview ? 'yes' : 'no',[...r.holdReasons,...r.reviewNotes].join(' ')])];
    const wb = Workbook.create(); const sheet = wb.worksheets.add('Records');
    sheet.getRangeByIndexes(0,0,matrix.length,header.length).values = matrix;
    wb.recalculate();
    assert.deepEqual(sheet.getUsedRange().values, matrix);
    // Artifact-tool supplies the cell values; CSV uses standard quoted-field serialization.
    const csv = sheet.getUsedRange().values.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n') + '\r\n';
    const roundTrip = await Workbook.fromCSV(csv, { sheetName: 'RoundTrip' });
    assert.deepEqual(roundTrip.worksheets.getItemAt(0).getUsedRange().values, matrix);
    await fs.writeFile(path.join(output, name), csv, { flag: 'wx' });
    csvFiles.push({ path: name, sha256: hash(csv), records: selected.length });
  }
  const data = { schemaVersion: 1, status: 'adjusted-candidates-not-frozen', reviewedAt: '2026-10-09',
    trainingReady: false, calibrationReady: false, trainingRunApproved: false,
    priorSubmissionMembership: 'pending-owner-additions-versus-replacements', sources,
    sourceMetadataRequired: false, frozenInputs: Object.fromEntries(before), outputs: csvFiles,
    counts: { submitted: 58, trainingCandidates: 18, calibrationCandidates: 19,
      quarantine: records.filter(r => r.disposition === 'quarantine').length,
      needsReview: records.filter(r => r.disposition === 'needs-review').length },
    blockers: ['earlier-dataset membership unresolved', 'held and quarantined record dispositions unresolved',
      'no role-level conditional sponsorship examples in new training', 'no locked independent held-out test'],
    recordsData: records };
  const json = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(path.join(output, 'adjusted-records.json'), json, { flag: 'wx' });
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ status: data.status,
    trainingRunApproved: false, corpus: { path: 'adjusted-records.json', sha256: hash(json), records: 58 },
    sources, outputs: csvFiles }, null, 2) + '\n', { flag: 'wx' });
  for (const [p, digest] of before) assert.equal(hash(await fs.readFile(path.join(root, p))), digest, 'Existing corpus/contract changed');
  for (const s of sources) assert.equal(hash(await fs.readFile(s.path)), s.sha256, 'Original CSV changed');
  console.log(JSON.stringify({ output, ...data.counts, checks: 'schema, exact text, IDs, candidate separation, CSV round-trip, hashes, original preservation' }));
}

if (process.argv.includes('--self-test')) {
  const source = { record:'1', intended_split:'train', employer:'Fixture', job_title:'Intern', text:'Fixture',
    scope:'role-specific', sponsorship:'refusal', timing:'now-only', cpt:'not stated', opt:'not stated' };
  assert.equal(adjust(source,'train').sponsorship, 'unavailable');
  assert.equal(adjust({...source,scope:'company policy',sponsorship:'conditional'},'train').sponsorship, 'unclear');
  assert.equal(adjust({...source,record:'12'},'train').cpt, 'explicitly-excluded');
  assert.equal(adjust({...source,record:'18',sponsorship:'available',cpt:'accepted',opt:'accepted'},'train').sponsorship, 'unclear');
  assert.equal(adjust({...source,record:'12',intended_split:'calibration',sponsorship:'refusal (citizenship restriction)'},'calibration').sponsorship, 'unclear');
  assert.equal(adjust({...source,record:'1',intended_split:'calibration'},'calibration').disposition, 'quarantine');
  assert.throws(() => adjust({...source,scope:'invented'},'train'));
  assert.throws(() => adjust(source,'calibration'));
  console.log('8 adjustment self-checks passed');
} else {
  await main();
}
