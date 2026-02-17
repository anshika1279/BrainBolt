const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding recent_question_ids column to user_state table...');
    
    await client.query(`
      ALTER TABLE user_state 
      ADD COLUMN IF NOT EXISTS recent_question_ids JSONB NOT NULL DEFAULT '[]'
    `);
    
    console.log('✓ Migration successful');
    console.log('✓ Column recent_question_ids added to user_state table');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
