const { execute } = require('../db/client');
const logger = require('./logger');

async function logAudit({ userId, action, entity, entityId, oldValue, newValue, ipAddress }) {
  try {
    await execute(
      `INSERT INTO activity_logs (user_id, action, entity, entity_id, old_value, new_value, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entity,
        entityId || null,
        oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : null,
        newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null,
        ipAddress || '127.0.0.1'
      ]
    );
  } catch (err) {
    logger.error('Failed to log audit activity:', err.message);
  }
}

module.exports = {
  logAudit
};
