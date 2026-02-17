const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding circular queue columns to user_state table...');
    
    // Add cycle_position column
    await client.query(`
      ALTER TABLE user_state 
      ADD COLUMN IF NOT EXISTS cycle_position INTEGER NOT NULL DEFAULT 0
    `);
    
    // Add difficulty_question_queue column
    await client.query(`
      ALTER TABLE user_state 
      ADD COLUMN IF NOT EXISTS difficulty_question_queue JSONB NOT NULL DEFAULT '[]'
    `);
    
    console.log('✓ Migration successful');
    console.log('✓ Columns cycle_position and difficulty_question_queue added to user_state table');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
