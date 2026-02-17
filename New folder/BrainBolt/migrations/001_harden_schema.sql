-- Migration: 001_harden_schema.sql
-- Purpose: Add CHECK constraints, foreign keys, CASCADE deletes, TIMESTAMPTZ upgrades
-- Run this on existing database to harden constraints

-- 1. Upgrade TIMESTAMP → TIMESTAMPTZ on all tables
ALTER TABLE users
ALTER COLUMN created_at TYPE TIMESTAMPTZ;

ALTER TABLE user_state
ALTER COLUMN last_answer_at TYPE TIMESTAMPTZ,
ALTER COLUMN updated_at TYPE TIMESTAMPTZ;

ALTER TABLE answer_log
ALTER COLUMN answered_at TYPE TIMESTAMPTZ;

ALTER TABLE leaderboard_score
ALTER COLUMN updated_at TYPE TIMESTAMPTZ;

ALTER TABLE leaderboard_streak
ALTER COLUMN updated_at TYPE TIMESTAMPTZ;

-- 2. Add CHECK constraints on questions
ALTER TABLE questions
ADD CONSTRAINT ck_questions_difficulty_range CHECK (difficulty BETWEEN 1 AND 10);

-- 3. Add CHECK constraints and FK ON DELETE CASCADE on user_state
ALTER TABLE user_state
ADD CONSTRAINT ck_user_state_current_difficulty_range CHECK (current_difficulty BETWEEN 1 AND 10),
ADD CONSTRAINT ck_user_state_streak_nonnegative CHECK (streak >= 0),
ADD CONSTRAINT ck_user_state_max_streak_nonnegative CHECK (max_streak >= 0),
ADD CONSTRAINT ck_user_state_total_score_nonnegative CHECK (total_score >= 0),
ADD CONSTRAINT ck_user_state_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
ADD CONSTRAINT ck_user_state_accuracy_range CHECK (accuracy >= 0 AND accuracy <= 1),
ALTER COLUMN user_id DROP CONSTRAINT user_state_user_id_fkey,
ADD CONSTRAINT user_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Add CHECK constraints, FK, and CASCADE deletes on answer_log
ALTER TABLE answer_log
ADD CONSTRAINT ck_answer_log_difficulty_range CHECK (difficulty BETWEEN 1 AND 10),
ADD CONSTRAINT answer_log_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
ALTER COLUMN user_id DROP CONSTRAINT answer_log_user_id_fkey,
ADD CONSTRAINT answer_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Optimize answer_log index: merged difficulty + timestamp ordering
DROP INDEX IF EXISTS answer_log_difficulty_idx;
CREATE INDEX IF NOT EXISTS answer_log_user_difficulty_idx ON answer_log (user_id, difficulty, answered_at DESC);

-- 6. Add CASCADE deletes on leaderboard tables
ALTER TABLE leaderboard_score
DROP CONSTRAINT leaderboard_score_user_id_fkey,
ADD CONSTRAINT leaderboard_score_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE leaderboard_streak
DROP CONSTRAINT leaderboard_streak_user_id_fkey,
ADD CONSTRAINT leaderboard_streak_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verification: Check all constraints are in place
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name IN ('users', 'questions', 'user_state', 'answer_log', 'leaderboard_score', 'leaderboard_streak')
ORDER BY table_name, constraint_name;
