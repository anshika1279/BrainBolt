const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding queue_difficulty column to user_state table...');
    
    await client.query(`
      ALTER TABLE user_state 
      ADD COLUMN IF NOT EXISTS queue_difficulty SMALLINT
    `);
    
    // Add CHECK constraint if it doesn't exist
    await client.query(`
      ALTER TABLE user_state 
      ADD CONSTRAINT check_queue_difficulty CHECK (queue_difficulty IS NULL OR (queue_difficulty BETWEEN 1 AND 10))
    `).catch(() => {
      // Constraint might already exist, ignore error
    });
    
    console.log('✓ Migration successful');
    console.log('✓ Column queue_difficulty added to user_state table');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
