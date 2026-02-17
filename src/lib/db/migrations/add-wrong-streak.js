/**
 * Migration: Add wrong_streak column
 * Adds tracking for consecutive wrong answers to support simplified streak-only difficulty algorithm
 */

import pg from "pg";

const { Pool } = pg;

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString,
    ssl: false, // Disable SSL for local development
  });

  try {
    console.log("Starting migration: add-wrong-streak");

    await pool.query(`
      ALTER TABLE user_state
      ADD COLUMN IF NOT EXISTS wrong_streak INTEGER NOT NULL DEFAULT 0;
    `);

    await pool.query(`
      ALTER TABLE user_state
      ADD CONSTRAINT user_state_wrong_streak_check
      CHECK (wrong_streak >= 0);
    `);

    console.log("✅ Migration complete: add-wrong-streak");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
