CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL CHECK(length(nickname) >= 2 AND length(nickname) <= 20),
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 999),
  timestamp INTEGER NOT NULL,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_score ON scores(score DESC);
