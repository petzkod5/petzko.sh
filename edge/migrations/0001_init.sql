-- Initial schema for the petzko-stats D1 database.
-- Applied with:  npx wrangler d1 migrations apply petzko-stats --remote
--          (or):  ... --local   (for the wrangler dev sandbox)

-- Generic counters / fun numbers (visit count, reactions, etc.).
CREATE TABLE IF NOT EXISTS counters (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (key, value) VALUES ('visits', 0);

-- Passive visit feed (anonymized) — powers a future "guest log" viewer.
CREATE TABLE IF NOT EXISTS visits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,        -- unix epoch (ms)
  country TEXT,                    -- request.cf.country (coarse)
  path    TEXT
);
CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts DESC);

-- Interactive guestbook (later phase — needs Turnstile + rate limiting on write).
CREATE TABLE IF NOT EXISTS guestbook (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  message    TEXT NOT NULL,
  country    TEXT,
  created_at INTEGER NOT NULL,     -- unix epoch (ms)
  approved   INTEGER NOT NULL DEFAULT 1,
  ip_hash    TEXT                  -- sha256(ip + salt); never store raw IPs
);
CREATE INDEX IF NOT EXISTS idx_guestbook ON guestbook(approved, created_at DESC);
