const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getFollowups(req, res, next) {
  try {
    const { category = 'today', assigned_to, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const todayStr = new Date().toISOString().split('T')[0];

    let whereClause = '1=1';
    let params = [];

    if (assigned_to || req.user.role === 'SALES') {
      whereClause += ' AND lf.assigned_to = ?';
      params.push(assigned_to || req.user.id);
    }

    if (category === 'today') {
      whereClause += ' AND lf.followup_date = ? AND lf.status = ?';
      params.push(todayStr, 'PENDING');
    } else if (category === 'overdue') {
      whereClause += ' AND lf.followup_date < ? AND lf.status = ?';
      params.push(todayStr, 'PENDING');
    } else if (category === 'upcoming') {
      whereClause += ' AND lf.followup_date > ? AND lf.status = ?';
      params.push(todayStr, 'PENDING');
    } else if (category === 'completed') {
      whereClause += ' AND lf.status = ?';
      params.push('COMPLETED');
    }

    const followups = await query(`
      SELECT lf.*, l.customer_name as lead_name, l.mobile as lead_mobile, l.lead_code, c.name as customer_name, u.name as assigned_to_name
      FROM lead_followups lf
      LEFT JOIN leads l ON lf.lead_id = l.id
      LEFT JOIN customers c ON lf.customer_id = c.id
      LEFT JOIN users u ON lf.assigned_to = u.id
      WHERE ${whereClause}
      ORDER BY lf.followup_date ASC, lf.followup_time ASC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);

    return res.json({ success: true, followups });
  } catch (err) {
    next(err);
  }
}

async function createFollowup(req, res, next) {
  try {
    const { lead_id, customer_id, assigned_to, followup_date, followup_time, type = 'CALL', notes } = req.body;

    if (!followup_date) {
      return res.status(400).json({ success: false, message: 'followup_date is required' });
    }

    const result = await execute(`
      INSERT INTO lead_followups (lead_id, customer_id, assigned_to, followup_date, followup_time, type, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      lead_id || null, customer_id || null, assigned_to || req.user.id,
      followup_date, followup_time || '10:00:00', type, notes || null
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'lead_followups',
      entityId: result.lastInsertRowid,
      newValue: { followup_date, type, notes },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Follow-up scheduled successfully', followupId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

async function updateFollowupStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, followup_date, followup_time, notes } = req.body;

    const followup = await queryOne('SELECT * FROM lead_followups WHERE id = ?', [id]);
    if (!followup) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    if (status === 'COMPLETED') {
      await execute(`
        UPDATE lead_followups SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, notes = COALESCE(?, notes)
        WHERE id = ?
      `, [notes || null, id]);
    } else if (status === 'RESCHEDULED' && followup_date) {
      await execute(`
        UPDATE lead_followups SET followup_date = ?, followup_time = COALESCE(?, followup_time), status = 'PENDING', notes = COALESCE(?, notes)
        WHERE id = ?
      `, [followup_date, followup_time || null, notes || null, id]);
    } else {
      await execute('UPDATE lead_followups SET status = ? WHERE id = ?', [status || followup.status, id]);
    }

    return res.json({ success: true, message: 'Follow-up updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFollowups,
  createFollowup,
  updateFollowupStatus
};
