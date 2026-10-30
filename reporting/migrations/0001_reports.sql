PRAGMA foreign_keys = ON;

CREATE TABLE intake_counters (
  day TEXT PRIMARY KEY,
  accepted INTEGER NOT NULL DEFAULT 0,
  acceptance_cap INTEGER NOT NULL CHECK (acceptance_cap > 0)
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  received_day TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  notice_version TEXT NOT NULL,
  submission_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'closed', 'spam')),
  posting_url TEXT NOT NULL,
  title TEXT,
  employer TEXT,
  location TEXT,
  role_identifier TEXT,
  payload_json TEXT NOT NULL
);

CREATE TRIGGER reports_enforce_daily_cap
BEFORE INSERT ON reports
WHEN COALESCE((SELECT accepted >= acceptance_cap FROM intake_counters WHERE day = NEW.received_day), 1)
BEGIN
  SELECT RAISE(ABORT, 'daily acceptance cap reached');
END;

CREATE TRIGGER reports_count_acceptance
AFTER INSERT ON reports
BEGIN
  UPDATE intake_counters SET accepted = accepted + 1 WHERE day = NEW.received_day;
END;

CREATE TABLE report_contacts (
  report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE report_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  occurred_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  event_type TEXT NOT NULL,
  detail TEXT
);

CREATE INDEX reports_inbox ON reports(status, received_at DESC);
CREATE INDEX reports_expiry ON reports(expires_at);
CREATE INDEX reports_identity ON reports(posting_url, category);
CREATE INDEX report_events_report ON report_events(report_id, occurred_at);
