-- Unique visitors, counted by a salted hash of the client IP (never the raw IP).
-- The Worker INSERT OR IGNOREs one row per distinct hash; COUNT(*) = uniques.
CREATE TABLE IF NOT EXISTS unique_visitors (
  ip_hash    TEXT PRIMARY KEY,   -- sha256(IP_SALT + CF-Connecting-IP)
  first_seen INTEGER NOT NULL    -- unix epoch (ms)
);
