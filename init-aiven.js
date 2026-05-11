require('dotenv').config();
const { getPool } = require('./lib/db');
const fs = require('fs');

async function init() {
  console.log('Connecting to Aiven MySQL...');
  const pool = getPool();
  
  try {
    const sql = fs.readFileSync('init.sql', 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} statements...`);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (e) {
        console.warn(`Statement failed: ${statement.slice(0, 50)}...`, e.message);
      }
    }

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
}

init();
