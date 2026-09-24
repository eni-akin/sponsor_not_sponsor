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
}

// Shared contract for section 2. Section 1 never manufactures findings.
export type SponsorshipStatus = 'available' | 'unavailable' | 'conditional' | 'unclear';
export type TrainingStatus = 'explicitly-accepted' | 'explicitly-excluded' | 'unclear';
export interface Finding<T> {
  status: T;
  evidenceIds: string[];
  explanation: string;
  requiresReview: boolean;
}
export interface Interpretation {
  sponsorship: Finding<SponsorshipStatus>;
  cpt: Finding<TrainingStatus>;
  opt: Finding<TrainingStatus>;
  restrictions: { text: string; evidenceIds: string[] }[];
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
