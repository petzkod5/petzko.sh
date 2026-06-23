CREATE TABLE IF NOT EXISTS content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,   -- JSON blob for the section (about | contacts | portfolio)
  updated_at INTEGER NOT NULL
);
