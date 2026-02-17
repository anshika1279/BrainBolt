const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding confidence_raw column to user_state table...');
    
    await client.query(`
      ALTER TABLE user_state 
      ADD COLUMN IF NOT EXISTS confidence_raw REAL NOT NULL DEFAULT 0
    `);
    
    // Add CHECK constraint if it doesn't exist
    await client.query(`
      ALTER TABLE user_state 
      ADD CONSTRAINT check_confidence_raw CHECK (confidence_raw >= -3 AND confidence_raw <= 3)
    `).catch(() => {
      // Constraint might already exist, ignore error
    });
    
    console.log('✓ Migration successful');
    console.log('✓ Column confidence_raw added to user_state table');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
