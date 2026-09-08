const fs = require('fs');
const path = require('path');
const { db } = require('./client');

async function initDb() {
  console.log('Initializing database schema...');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Strip single-line comments (-- ...)
  const cleanSql = schemaSql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split schema into individual SQL statements
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (err) {
      console.error('Error executing statement:', statement.substring(0, 50), err.message);
    }
  }

  console.log('Database initialization completed successfully!');
}

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = { initDb };
