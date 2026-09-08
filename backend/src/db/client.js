const { createClient } = require('@libsql/client');
const env = require('../config/env');

const clientConfig = {
  url: env.TURSO_DATABASE_URL
};

if (env.TURSO_AUTH_TOKEN) {
  clientConfig.authToken = env.TURSO_AUTH_TOKEN;
}

const db = createClient(clientConfig);

// Helper wrapper for parameterized SQL execution returning rows array
async function query(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows || [];
}

// Helper wrapper for single row execution
async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows[0] || null;
}

// Helper wrapper for insert/update/delete operations returning info
async function execute(sql, args = []) {
  const result = await db.execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
    rowsAffected: result.rowsAffected
  };
}

module.exports = {
  db,
  query,
  queryOne,
  execute
};
