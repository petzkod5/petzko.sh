CREATE TABLE IF NOT EXISTS telemetry (
  cluster_id TEXT PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'replica',  -- 'primary' | 'replica'
  value      TEXT NOT NULL,                     -- sanitized snapshot JSON
  updated_at INTEGER NOT NULL                   -- ms; server-stamped on ingest
);
