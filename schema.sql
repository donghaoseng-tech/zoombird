-- ZoomBird Leaderboard Database Schema

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_score_desc ON leaderboard(score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_created_at ON leaderboard(created_at DESC);

-- Insert some sample data (optional)
INSERT INTO leaderboard (name, score, created_at) VALUES
  ('测试玩家1', 100, datetime('now', '-10 days')),
  ('TestPlayer2', 85, datetime('now', '-9 days')),
  ('玩家三', 72, datetime('now', '-8 days')),
  ('Player4', 65, datetime('now', '-7 days')),
  ('测试5', 58, datetime('now', '-6 days')),
  ('Demo6', 45, datetime('now', '-5 days')),
  ('玩家7', 38, datetime('now', '-4 days')),
  ('Test8', 25, datetime('now', '-3 days')),
  ('Player9', 18, datetime('now', '-2 days')),
  ('玩家10', 10, datetime('now', '-1 day'));
