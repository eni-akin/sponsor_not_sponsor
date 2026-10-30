export const MAX_REPORT_BYTES = 256 * 1024;
export const REPORT_SCHEMA_VERSION = 1;
export const REPORT_NOTICE_VERSION = '2026-10-27';

export const reportCategories = [
  'sponsorship', 'cpt-opt', 'role-employer', 'evidence', 'missing-badge', 'other',
] as const;

type Category = typeof reportCategories[number];
type PageKind = 'job-posting' | 'job-application' | 'multiple-jobs' | 'non-job' | 'unreadable';
type DecisionStatus = 'explicit-blocker' | 'sponsorship-stated' | 'no-blocker' | 'could-not-verify';

export interface ReportSubmission {
  schemaVersion: 1;
  noticeVersion: string;
  submissionKey: string;
  turnstileToken: string;
  category: Category;
  expectedOutcome: string;
  explanation: string;
  relevantPassage: string;
  email?: string;
  posting: {
    url: string;
    title?: string;
    employer?: string;
    location?: string;
    roleIdentifier?: string;
  };
  diagnostic?: {
    formatVersion: 1 | 2;
    extensionVersion: string;
    createdAt: string;
    scannedAt: string;
    pageKind: PageKind;
    displayedDecision?: { status: DecisionStatus; label: string; explanation: string };
    warnings: string[];
    findings?: unknown;
    partial?: boolean;
    coverage?: { completeness: 'description-found' | 'incomplete'; sources: {kind:string;descriptionFound:boolean}[]; gaps:string[] };
  };
}

const object = (value: unknown, name: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
  return value as Record<string, unknown>;
};

const exact = (value: Record<string, unknown>, allowed: readonly string[], name: string): void => {
  const unexpected = Object.keys(value).find(key => !allowed.includes(key));
  if (unexpected) throw new Error(`${name}.${unexpected} is not allowed.`);
};

const text = (value: unknown, name: string, max: number, required = true): string | undefined => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || (required && value.trim().length === 0) || value.length > max) {
    throw new Error(`${name} must be ${required ? 'between 1 and' : 'at most'} ${max} characters.`);
  }
  return value;
};

const timestamp = (value: unknown, name: string): string => {
  const result = text(value, name, 40)!;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) throw new Error(`${name} must be a valid timestamp.`);
  return result;
};

export function sanitizeReportUrl(value: unknown, name = 'posting.url'): string {
  const raw = text(value, name, 2048)!;
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`${name} must use HTTP or HTTPS.`);
  url.username = ''; url.password = ''; url.search = ''; url.hash = '';
  return url.toString();
}

const optionalText = (value: unknown, name: string, max: number): string | undefined => text(value, name, max, false);

export function parseReportSubmission(value: unknown, byteLength = new TextEncoder().encode(JSON.stringify(value)).byteLength): ReportSubmission {
  if (byteLength > MAX_REPORT_BYTES) throw new Error(`Report exceeds the ${MAX_REPORT_BYTES}-byte limit.`);
  const input = object(value, 'report');
  exact(input, ['schemaVersion', 'noticeVersion', 'submissionKey', 'turnstileToken', 'category', 'expectedOutcome', 'explanation', 'relevantPassage', 'email', 'posting', 'diagnostic'], 'report');
  if (input.schemaVersion !== REPORT_SCHEMA_VERSION) throw new Error('report.schemaVersion is unsupported.');
  const category = input.category;
  if (typeof category !== 'string' || !reportCategories.includes(category as Category)) throw new Error('report.category is unsupported.');
  const email = optionalText(input.email, 'report.email', 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('report.email is invalid.');

  const postingInput = object(input.posting, 'report.posting');
  exact(postingInput, ['url', 'title', 'employer', 'location', 'roleIdentifier'], 'report.posting');
  const posting: ReportSubmission['posting'] = {
    url: sanitizeReportUrl(postingInput.url),
    ...optionalFields(postingInput, 'report.posting', ['title', 'employer', 'location', 'roleIdentifier'], 300),
  };

  let diagnostic: ReportSubmission['diagnostic'];
  if (input.diagnostic !== undefined) {
    const item = object(input.diagnostic, 'report.diagnostic');
    exact(item, ['formatVersion', 'extensionVersion', 'createdAt', 'scannedAt', 'pageKind', 'displayedDecision', 'warnings', 'findings', 'partial', 'coverage'], 'report.diagnostic');
    if (item.partial !== undefined && typeof item.partial !== 'boolean') throw new Error('diagnostic.partial must be boolean.');
    if (item.formatVersion !== 1 && item.formatVersion !== 2) throw new Error('report.diagnostic.formatVersion is unsupported.');
    const pageKinds: PageKind[] = ['job-posting', 'job-application', 'multiple-jobs', 'non-job', 'unreadable'];
    if (typeof item.pageKind !== 'string' || !pageKinds.includes(item.pageKind as PageKind)) throw new Error('report.diagnostic.pageKind is unsupported.');
    if (!Array.isArray(item.warnings) || item.warnings.length > 20) throw new Error('report.diagnostic.warnings must contain at most 20 items.');
    let displayedDecision: NonNullable<ReportSubmission['diagnostic']>['displayedDecision'] | undefined;
    if (item.displayedDecision !== undefined) {
      const decision = object(item.displayedDecision, 'report.diagnostic.displayedDecision');
      exact(decision, ['status', 'label', 'explanation'], 'report.diagnostic.displayedDecision');
      const statuses: DecisionStatus[] = ['explicit-blocker', 'sponsorship-stated', 'no-blocker', 'could-not-verify'];
      if (typeof decision.status !== 'string' || !statuses.includes(decision.status as DecisionStatus)) throw new Error('report.diagnostic.displayedDecision.status is unsupported.');
      displayedDecision = {
        status: decision.status as DecisionStatus,
        label: text(decision.label, 'report.diagnostic.displayedDecision.label', 100)!,
        explanation: text(decision.explanation, 'report.diagnostic.displayedDecision.explanation', 1000)!,
      };
    }
    diagnostic = {
      formatVersion: item.formatVersion,
      extensionVersion: text(item.extensionVersion, 'report.diagnostic.extensionVersion', 40)!,
      createdAt: timestamp(item.createdAt, 'report.diagnostic.createdAt'),
      scannedAt: timestamp(item.scannedAt, 'report.diagnostic.scannedAt'),
      pageKind: item.pageKind as PageKind,
      ...(displayedDecision ? { displayedDecision } : {}),
      warnings: item.warnings.map((warning, index) => text(warning, `report.diagnostic.warnings[${index}]`, 500)!),
      ...(item.findings == null ? {} : { findings: validateReportFindings(item.findings) }),
      ...(item.partial === undefined ? {} : { partial: item.partial }),
      ...(item.coverage === undefined ? {} : { coverage: validateCoverage(item.coverage) }),
    };
  }

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    noticeVersion: input.noticeVersion === REPORT_NOTICE_VERSION ? REPORT_NOTICE_VERSION : (() => { throw new Error('Review the current privacy notice before submitting.'); })(),
    submissionKey: text(input.submissionKey, 'report.submissionKey', 100)!,
    turnstileToken: text(input.turnstileToken, 'report.turnstileToken', 2048)!,
    category: category as Category,
    expectedOutcome: text(input.expectedOutcome, 'report.expectedOutcome', 1000, false) ?? '',
    explanation: text(input.explanation, 'report.explanation', 2000)!,
    relevantPassage: text(input.relevantPassage, 'report.relevantPassage', 8000, false) ?? '',
    ...(email === undefined ? {} : { email }), posting, ...(diagnostic ? { diagnostic } : {}),
  };
}

function validateCoverage(value:unknown): NonNullable<ReportSubmission['diagnostic']>['coverage'] {
  const item=object(value,'coverage'); exact(item,['completeness','sources','gaps'],'coverage');
  if (!['description-found','incomplete'].includes(String(item.completeness)) || !Array.isArray(item.sources) || item.sources.length>20 || !Array.isArray(item.gaps) || item.gaps.length>10) throw new Error('Invalid diagnostic coverage.');
  const sources=item.sources.map(value=>{
    const source=object(value,'coverage source');exact(source,['kind','descriptionFound'],'coverage source');
    if (!['visible-page','structured-data','embedded-frame','embedded-structured-data','official-overview'].includes(String(source.kind)) || typeof source.descriptionFound!=='boolean') throw new Error('Invalid coverage source.');
    return {kind:source.kind as string,descriptionFound:source.descriptionFound};
  });
  const gaps=item.gaps.map(value=>{
    if (!['displayed-overview-missing','description-not-found','truncated','embedded-content-unread','overview-unavailable','overview-identity-mismatch'].includes(String(value))) throw new Error('Invalid coverage gap.');
    return value as string;
  });
  return {completeness:item.completeness as 'description-found'|'incomplete',sources,gaps};
}

export function validateReportFindings(value: unknown): unknown {
  let quotations = 0;
  const list = (value: unknown, max = 40): unknown[] => {
    if (!Array.isArray(value) || value.length > max) throw new Error('Diagnostic collection is too large or invalid.');
    return value;
  };
  const strings = (value: unknown) => list(value).map(item => text(item, 'evidenceId', 100)!);
  const citation = (value: unknown) => {
    const item = object(value,'citation');
    exact(item,['evidenceId','quote','source','sourceUrl','timing'],'citation');
    if (++quotations > 40) throw new Error('At most 40 diagnostic quotations are allowed. Remove diagnostics or reduce the report.');
    if (!['visible-page','structured-data','embedded-frame','embedded-structured-data','official-overview'].includes(String(item.source)) || !['unspecified','now','future','now-and-future'].includes(String(item.timing))) throw new Error('Invalid citation source or timing.');
    return { evidenceId:text(item.evidenceId,'evidenceId',100), quote:text(item.quote,'quote',4000),source:item.source,timing:item.timing,...(item.sourceUrl === undefined ? {} : {sourceUrl:sanitizeReportUrl(item.sourceUrl,'citation URL')}) };
  };
  const finding = (value: unknown, statuses: string[]) => {
    const item = object(value,'finding');
    exact(item,['status','evidenceIds','explanation','requiresReview','citations'],'finding');
    if (!statuses.includes(String(item.status)) || typeof item.requiresReview !== 'boolean') throw new Error('Invalid diagnostic finding.');
    return {status:item.status,evidenceIds:strings(item.evidenceIds),explanation:text(item.explanation,'explanation',2000,false) ?? '',requiresReview:item.requiresReview,citations:list(item.citations).map(citation)};
  };
  const input = object(value,'findings');
  exact(input,['sponsorship','cpt','opt','sponsorshipByTiming','restrictions','context'],'findings');
  const sponsorship = ['available','unavailable','conditional','unclear'];
  const training = ['explicitly-accepted','explicitly-excluded','unclear'];
  const timing = object(input.sponsorshipByTiming,'sponsorshipByTiming');
  exact(timing,['now','future'],'sponsorshipByTiming');
  return {
    sponsorship:finding(input.sponsorship,sponsorship), cpt:finding(input.cpt,training), opt:finding(input.opt,training),
    sponsorshipByTiming:{now:finding(timing.now,sponsorship),future:finding(timing.future,sponsorship)},
    restrictions:list(input.restrictions,20).map(value => {
      const item=object(value,'restriction'); exact(item,['kind','text','evidenceIds','citations'],'restriction');
      if (!['citizenship','permanent-residency','us-person','work-authorization','stated-condition','export-control'].includes(String(item.kind))) throw new Error('Invalid restriction kind.');
      return {kind:item.kind,text:text(item.text,'restriction text',4000),evidenceIds:strings(item.evidenceIds),citations:list(item.citations).map(citation)};
    }),
    context:list(input.context,20).map(value => {
      const item=object(value,'context'); exact(item,['kind','citation'],'context');
      if (!['question','historical','company','other-role','export-notice','unrecognized'].includes(String(item.kind))) throw new Error('Invalid context kind.');
      return {kind:item.kind,citation:citation(item.citation)};
    }),
  };
}

function optionalFields(value: Record<string, unknown>, prefix: string, keys: readonly string[], max: number): Record<string, string> {
  return Object.fromEntries(keys.flatMap(key => {
    const item = optionalText(value[key], `${prefix}.${key}`, max);
    return item === undefined ? [] : [[key, item]];
  }));
}
