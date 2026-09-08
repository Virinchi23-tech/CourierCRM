const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getSettings(req, res, next) {
  try {
    const settings = await query('SELECT * FROM system_settings ORDER BY category, key');
    return res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

async function updateSetting(req, res, next) {
  try {
    const { settings, key, value, category, description } = req.body;

    if (Array.isArray(settings)) {
      for (const item of settings) {
        if (!item.key) continue;
        const existing = await queryOne('SELECT * FROM system_settings WHERE key = ?', [item.key]);
        if (existing) {
          await execute('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [String(item.value ?? ''), item.key]);
        } else {
          await execute('INSERT INTO system_settings (key, value, category, description) VALUES (?, ?, ?, ?)', [item.key, String(item.value ?? ''), item.category || 'GENERAL', item.description || null]);
        }
      }
    } else if (key && value !== undefined) {
      const existing = await queryOne('SELECT * FROM system_settings WHERE key = ?', [key]);
      if (existing) {
        await execute('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [String(value), key]);
      } else {
        await execute('INSERT INTO system_settings (key, value, category, description) VALUES (?, ?, ?, ?)', [key, String(value), category || 'GENERAL', description || null]);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payload. Provide setting key/value or settings array.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'system_settings',
      newValue: settings || { key, value },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { search, page = 1, limit = 15 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (al.action LIKE ? OR al.entity LIKE ? OR u.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countRes = await queryOne(`SELECT COUNT(*) as total FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const logs = await query(`
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.id DESC LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);

    return res.json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSetting,
  getAuditLogs
};
