import { parseReportSubmission, sanitizeReportUrl } from './schema.js';
const MAX_BYTES = 256 * 1024;
const NOTICE_VERSION = '2026-10-30';
const form = document.querySelector('#report-form');
const file = document.querySelector('#report-file');
const errors = document.querySelector('#errors');
const importStatus = document.querySelector('#import-status');
const summary = document.querySelector('#diagnostic-summary');
const diagnosticEditor = document.querySelector('#diagnostic-editor');
const submitStatus = document.querySelector('#submit-status');
const submitButton = document.querySelector('#submit');
let diagnostic;
let submittedSnapshot = '';
let submissionKey = crypto.randomUUID();
let submissionEnabled = false;

const value = id => document.querySelector(`#${id}`).value.trim();
const set = (id, next) => { if (next !== undefined && next !== null) document.querySelector(`#${id}`).value = String(next); };

function fail(message) {
  errors.textContent = message;
  errors.hidden = false;
  errors.focus();
}

function pauseSubmission(message) {
  submissionEnabled = false;
  submitButton.disabled = true;
  submitStatus.textContent = message;
}

async function configureSubmission() {
  try {
    const response = await fetch('/api/config', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const config = await response.json();
    if (!response.ok) throw new Error('Configuration unavailable.');
    if (config.available !== true || typeof config.turnstileSitekey !== 'string' || !config.turnstileSitekey) {
      pauseSubmission('Reporting is temporarily unavailable. You can still import and prepare a draft in this tab.');
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    if (!globalThis.turnstile?.render) throw new Error('Challenge unavailable.');
    globalThis.turnstile.render('#turnstile', { sitekey: config.turnstileSitekey, action: 'report-submit', theme: 'light' });
    submissionEnabled = true;
    submitButton.disabled = false;
    submitStatus.textContent = '';
  } catch {
    pauseSubmission('Reporting availability could not be checked. You can still import and prepare a draft in this tab.');
  }
}

configureSubmission();

function category(reason = '') {
  if (/CPT|OPT/i.test(reason)) return 'cpt-opt';
  if (/role|employer/i.test(reason)) return 'role-employer';
  if (/evidence/i.test(reason)) return 'evidence';
  if (/sponsorship/i.test(reason)) return 'sponsorship';
  return 'other';
}

function importDiagnostic(report) {
  if (!report || (report.formatVersion !== 1 && report.formatVersion !== 2)) throw new Error('This is not a supported SNS report (format 1 or 2).');
  if (typeof report.sourceUrl !== 'string' || typeof report.createdAt !== 'string' || typeof report.scannedAt !== 'string' || typeof report.pageKind !== 'string') throw new Error('The SNS report is missing required diagnostic fields.');
  set('posting-url', sanitizeReportUrl(report.sourceUrl));
  set('title', report.role?.title);
  set('employer', report.role?.employer);
  set('location', report.role?.location);
  set('role-identifier', report.role?.identifier);
  set('category', category(report.reason));
  set('expected-outcome', report.displayedDecision?.label ? `Expected a different result than “${report.displayedDecision.label}”.` : undefined);
  diagnostic = {
    formatVersion: report.formatVersion,
    extensionVersion: report.extensionVersion,
    createdAt: report.createdAt,
    scannedAt: report.scannedAt,
    pageKind: report.pageKind,
    ...(report.displayedDecision ? { displayedDecision: {
      status: report.displayedDecision.status,
      label: report.displayedDecision.label,
      explanation: report.displayedDecision.explanation,
    } } : {}),
    warnings: report.warnings,
    ...(report.findings ? {findings:report.findings}:{}),
    partial: report.formatVersion === 1,
    ...(report.role?.completeness ? {coverage:{completeness:report.role.completeness,sources:report.role.descriptionSources ?? [],gaps:report.role.descriptionGaps ?? []}}:{}),
  };
  diagnostic = parseReportSubmission({...draft('import-preview'),expectedOutcome:'Preview',explanation:'Preview',relevantPassage:'Preview',diagnostic}).diagnostic;
  diagnosticEditor.value=JSON.stringify(diagnostic,null,2);
  diagnosticEditor.hidden=false;
  document.querySelector('#remove-diagnostic').hidden=false;
  summary.textContent = `Imported SNS format ${report.formatVersion}, extension ${diagnostic.extensionVersion}, scanned ${new Date(report.scannedAt).toLocaleString()}. ${report.displayedDecision ? `Displayed result: ${report.displayedDecision.label}.` : 'Displayed result was unavailable in this older format.'}`;
}

file.addEventListener('change', async () => {
  errors.hidden = true;
  const selected = file.files[0];
  const previous = diagnostic;
  const previousFields = [...form.querySelectorAll('input:not([type="file"]),textarea,select')].map(element=>[element,element.value]);
  if (!selected) return;
  if (selected.size > MAX_BYTES) { file.value = ''; fail('The selected report is larger than 256 KiB.'); return; }
  try {
    importDiagnostic(JSON.parse(await selected.text()));
    importStatus.textContent = 'Diagnostic imported. Review and edit every field below before submitting.';
  } catch (error) {
    diagnostic = previous;
    for(const [element,oldValue] of previousFields) element.value=oldValue;
    fail(error instanceof Error ? error.message : 'The report could not be imported.');
  }
});

document.querySelector('#remove-diagnostic').onclick=()=>{diagnostic=undefined;diagnosticEditor.value='';diagnosticEditor.hidden=true;summary.textContent='Diagnostics removed. This is a partial manual report.';};

function draft(token) {
  const optional = (name, next) => next ? { [name]: next } : {};
  return {
    schemaVersion: 1,
    noticeVersion: NOTICE_VERSION,
    submissionKey,
    turnstileToken: token,
    category: value('category'),
    expectedOutcome: value('expected-outcome'),
    explanation: value('explanation'),
    relevantPassage: document.querySelector('#relevant-passage').value,
    ...optional('email', value('email')),
    posting: {
      url: value('posting-url'),
      ...optional('title', value('title')),
      ...optional('employer', value('employer')),
      ...optional('location', value('location')),
      ...optional('roleIdentifier', value('role-identifier')),
    },
    ...(diagnostic ? { diagnostic } : {}),
  };
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  errors.hidden = true;
  submitStatus.textContent = '';
  if (!submissionEnabled) { fail('Reporting is temporarily unavailable. Keep this draft open and try again later.'); return; }
  if (!form.reportValidity()) return;
  const token = form.querySelector('[name="cf-turnstile-response"]')?.value;
  if (!token) { fail('Complete the verification challenge before submitting.'); return; }
  let reviewed;
  try {
    if (diagnostic && diagnosticEditor.value !== JSON.stringify(diagnostic,null,2)) diagnostic={...JSON.parse(diagnosticEditor.value),partial:true};
    reviewed=parseReportSubmission(draft(token));
  } catch(error) {fail(error.message);return;}
  const current = JSON.stringify({...reviewed,submissionKey:'',turnstileToken:''});
  if (submittedSnapshot && submittedSnapshot !== current) submissionKey = crypto.randomUUID();
  const body = {...reviewed,submissionKey};
  submittedSnapshot = current;
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),signal:AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || result.accepted !== true || typeof result.reportId !== 'string') throw new Error(result.error || 'The report could not be submitted.');
    submitStatus.textContent = `Report received. Save this private receipt: ${result.reportId}`;
    submitStatus.focus();
  } catch (error) {
    fail(error instanceof Error ? error.message : 'The report could not be submitted. Keep this tab open and try again.');
  } finally {
    submitButton.disabled = !submissionEnabled;
    globalThis.turnstile?.reset();
  }
});
