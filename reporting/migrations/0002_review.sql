ALTER TABLE reports ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reports ADD COLUMN closed_at TEXT;
ALTER TABLE reports ADD COLUMN resolution TEXT NOT NULL DEFAULT '';
ALTER TABLE reports ADD COLUMN severity TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE reports ADD COLUMN duplicate_of TEXT REFERENCES reports(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN issue_url TEXT NOT NULL DEFAULT '';
ALTER TABLE reports ADD COLUMN fixed_version TEXT NOT NULL DEFAULT '';
CREATE TABLE deletion_ledger (
  report_id TEXT PRIMARY KEY,
  deleted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX deletion_ledger_expiry ON deletion_ledger(expires_at);
CREATE TABLE operational_health (
  name TEXT PRIMARY KEY,
  succeeded_at TEXT,
  failed_at TEXT,
  deleted_count INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER reports_duplicate_primary
BEFORE UPDATE OF duplicate_of ON reports
WHEN NEW.duplicate_of IS NOT NULL AND (
  NEW.duplicate_of = NEW.id OR
  NOT EXISTS (SELECT 1 FROM reports WHERE id=NEW.duplicate_of AND duplicate_of IS NULL) OR
  EXISTS (SELECT 1 FROM reports WHERE duplicate_of=NEW.id)
)
BEGIN
  SELECT RAISE(ABORT, 'invalid duplicate primary');
END;
