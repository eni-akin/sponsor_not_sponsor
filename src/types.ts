export type PageKind = 'job-posting' | 'job-application' | 'multiple-jobs' | 'non-job' | 'unreadable';

export interface EvidenceBlock {
  id: string;
  text: string;
  source: 'visible-page' | 'structured-data';
  kind: 'text' | 'application-question';
  /** A location hint, never executable page content. */
  locator: string;
}

export interface JobRecord {
  key: string;
  title: string;
  employer: string | null;
  location: string | null;
  identifier: string | null;
  employmentTypes: string[];
  evidence: EvidenceBlock[];
  completeness: 'description-found' | 'incomplete';
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
}

export type SponsorshipStatus = 'available' | 'unavailable' | 'conditional' | 'unclear';
export type TrainingStatus = 'explicitly-accepted' | 'explicitly-excluded' | 'unclear';
export type Timing = 'unspecified' | 'now' | 'future' | 'now-and-future';
export interface Citation {
  evidenceId: string;
  quote: string;
  source: EvidenceBlock['source'];
  timing: Timing;
}
export interface Finding<T> {
  status: T;
  evidenceIds: string[];
  explanation: string;
  requiresReview: boolean;
  citations: Citation[];
}
export interface Interpretation {
  sponsorship: Finding<SponsorshipStatus>;
  cpt: Finding<TrainingStatus>;
  opt: Finding<TrainingStatus>;
  sponsorshipByTiming: { now: Finding<SponsorshipStatus>; future: Finding<SponsorshipStatus> };
  restrictions: { kind: 'citizenship' | 'permanent-residency' | 'us-person' | 'work-authorization' | 'stated-condition'; text: string; evidenceIds: string[]; citations: Citation[] }[];
  context: { kind: 'question' | 'historical' | 'company' | 'other-role' | 'unrecognized'; citation: Citation }[];
}

export interface Settings {
  paused: boolean;
  disabledHosts: string[];
}
export interface ScannerSnapshot {
  research?: import('./research').ResearchView;
  state: 'scanning' | 'ready' | 'paused' | 'disabled' | 'error';
  hostname: string;
  result: ScanResult | null;
}
