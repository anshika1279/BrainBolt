CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  difficulty SMALLINT NOT NULL,
  CHECK (difficulty BETWEEN 1 AND 10),
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer_hash TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  session_id TEXT NOT NULL,
  current_difficulty SMALLINT NOT NULL,
  CHECK (current_difficulty BETWEEN 1 AND 10),
  streak INTEGER NOT NULL,
  CHECK (streak >= 0),
  wrong_streak INTEGER NOT NULL DEFAULT 0,
  CHECK (wrong_streak >= 0),
  max_streak INTEGER NOT NULL,
  CHECK (max_streak >= 0),
  total_score INTEGER NOT NULL,
  CHECK (total_score >= 0),
  confidence REAL NOT NULL,
  CHECK (confidence >= 0 AND confidence <= 1),
  confidence_raw REAL NOT NULL DEFAULT 0,
  CHECK (confidence_raw >= -3 AND confidence_raw <= 3),
  accuracy REAL NOT NULL,
  CHECK (accuracy >= 0 AND accuracy <= 1),
  answers_count INTEGER NOT NULL,
  last_question_id TEXT,
  cycle_position INTEGER NOT NULL DEFAULT 0,
  queue_difficulty SMALLINT,
  CHECK (queue_difficulty IS NULL OR (queue_difficulty BETWEEN 1 AND 10)),
  difficulty_question_queue JSONB NOT NULL DEFAULT '[]',
  recent_question_ids JSONB NOT NULL DEFAULT '[]',
  last_answer_at TIMESTAMPTZ,
  recent_performance JSONB NOT NULL DEFAULT '[]',
  state_version INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  difficulty SMALLINT NOT NULL,
  CHECK (difficulty BETWEEN 1 AND 10),
  answer TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  score_delta INTEGER NOT NULL,
  streak_at_answer INTEGER NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answer_idempotency_key TEXT NOT NULL,
  response_payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS answer_log_idempotency_idx ON answer_log (user_id, answer_idempotency_key);
CREATE INDEX IF NOT EXISTS answer_log_user_idx ON answer_log (user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS answer_log_user_difficulty_idx ON answer_log (user_id, difficulty, answered_at DESC);

CREATE TABLE IF NOT EXISTS leaderboard_score (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_streak (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  max_streak INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON leaderboard_score (total_score DESC);
CREATE INDEX IF NOT EXISTS leaderboard_streak_idx ON leaderboard_streak (max_streak DESC);
