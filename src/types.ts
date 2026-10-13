export type PageKind = 'job-posting' | 'job-application' | 'multiple-jobs' | 'non-job' | 'unreadable';

export interface EvidenceBlock {
  id: string;
  text: string;
  source: 'visible-page' | 'structured-data' | 'embedded-frame' | 'embedded-structured-data' | 'official-overview';
  /** Public source page for evidence collected outside the current document. */
  sourceUrl?: string;
  kind: 'text' | 'application-question';
  /** A location hint, never executable page content. */
  locator: string;
  contextGroup?: string;
  position?: number;
}

export interface DescriptionCoverage {
  /** This reports inspected sources, not a guarantee that an employer disclosed every policy. */
  status: 'description-found' | 'incomplete';
  sources: { kind: EvidenceBlock['source']; url: string; passages: number; descriptionFound: boolean }[];
  gaps: ('displayed-overview-missing' | 'description-not-found' | 'truncated' | 'embedded-content-unread' | 'overview-unavailable' | 'overview-identity-mismatch')[];
}

export type ContextGroup = {
  id: string;
  firstPosition: number;
  lastPosition: number;
  start: 'boundary' | 'missing';
  end: 'boundary' | 'missing';
};

export interface JobRecord {
  key: string;
  title: string;
  employer: string | null;
  country?: string | null;
  location: string | null;
  identifier: string | null;
  employmentTypes: string[];
  evidence: EvidenceBlock[];
  contextGroups?: ContextGroup[];
  completeness: 'description-found' | 'incomplete';
  coverage?: DescriptionCoverage;
}

export interface ScanResult {
  version: 1;
  url: string;
  scannedAt: string;
  kind: PageKind;
  role: JobRecord | null;
  signals: string[];
  warnings: string[];
  interpretation?: Interpretation;
  decisionComparison?: { state: 'disabled' | 'pending' | 'ready' | 'error'; message: string; interpretation?: Interpretation };
}

export type SponsorshipStatus = 'available' | 'unavailable' | 'conditional' | 'unclear';
export type TrainingStatus = 'explicitly-accepted' | 'explicitly-excluded' | 'unclear';
export type MainDecisionStatus = 'explicit-blocker' | 'sponsorship-stated' | 'no-blocker' | 'could-not-verify';
export type Timing = 'unspecified' | 'now' | 'future' | 'now-and-future';
export interface Citation {
  evidenceId: string;
  quote: string;
  source: EvidenceBlock['source'];
  sourceUrl?: string;
  timing: Timing;
  citationRole?: 'target' | 'context';
}
export interface Finding<T> {
  status: T;
  evidenceIds: string[];
  explanation: string;
  requiresReview: boolean;
  citations: Citation[];
}
export interface Interpretation {
  decision?: { engine: 'laya'; state: 'pending' | 'ready' | 'error'; message: string; model?: string; processingStatus?: 'complete' | 'partial' };
  sponsorship: Finding<SponsorshipStatus>;
  cpt: Finding<TrainingStatus>;
  opt: Finding<TrainingStatus>;
  sponsorshipByTiming: { now: Finding<SponsorshipStatus>; future: Finding<SponsorshipStatus> };
  restrictions: { kind: 'citizenship' | 'permanent-residency' | 'us-person' | 'work-authorization' | 'stated-condition' | 'export-control'; text: string; evidenceIds: string[]; citations: Citation[] }[];
  context: { kind: 'question' | 'historical' | 'company' | 'other-role' | 'export-notice' | 'unrecognized'; citation: Citation }[];
}

export type Probability = number;

export type ScreeningResult =
  | { status: 'success'; choice: 'relevant' | 'irrelevant'; probability: Probability }
  | { status: 'failed'; reason: 'inference-failed' }
  | { status: 'unsupported'; reason: 'context-too-long' | 'missing-context' | 'unsupported-input' };

export type Route = 'relevant' | 'uncertain' | 'skip';

export type InterpretationAnswers = {
  scope: { choice: 'role' | 'question' | 'historical' | 'company' | 'other-role' | 'none'; probability: Probability };
  sponsorship: { choice: 'available' | 'unavailable' | 'conditional' | 'unclear'; probability: Probability };
  timing: { choice: 'unspecified' | 'now' | 'future' | 'now-and-future'; probability: Probability };
  cpt: { choice: 'explicitly-accepted' | 'explicitly-excluded' | 'unclear'; probability: Probability };
  opt: { choice: 'explicitly-accepted' | 'explicitly-excluded' | 'unclear'; probability: Probability };
};

export type InterpretationResult =
  | { status: 'interpreted'; answers: InterpretationAnswers }
  | { status: 'skipped'; reason: 'screened-irrelevant' }
  | { status: 'failed'; reason: 'inference-failed' | 'screening-failed' }
  | { status: 'unsupported'; reason: 'context-too-long' | 'unsupported-input' | 'screening-unsupported' };

export type BlockResultV2 = {
  id: string;
  screening: ScreeningResult;
  route: Route;
  interpretation: InterpretationResult;
};

export type DecisionRequestV2 = {
  version: 'laya-policy-v2';
  title: string;
  employer: string | null;
  country: string | null;
  contextGroups: ContextGroup[];
  blocks: {
    id: string;
    text: string;
    kind: 'text' | 'application-question';
    contextGroup: string;
    position: number;
  }[];
};

export type DecisionResultV2 = {
  version: 'laya-policy-v2';
  engine: 'laya';
  model: string;
  configuration: {
    questionsSha256: string;
    contextSha256: string;
    parametersSha256: string;
  };
  processing: {
    status: 'complete' | 'partial';
    inputCount: number;
    context: { complete: number; missing: number };
    screening: { success: number; failed: number; unsupported: number };
    interpretation: { interpreted: number; skipped: number; failed: number; unsupported: number };
  };
  blocks: BlockResultV2[];
};

export interface MainDecision {
  status: MainDecisionStatus;
  label: string;
  explanation: string;
  citations: Citation[];
}

export interface Settings {
  paused: boolean;
  disabledHosts: string[];
}
export interface ScannerSnapshot {
  state: 'scanning' | 'ready' | 'paused' | 'disabled' | 'error';
  hostname: string;
  result: ScanResult | null;
}
