const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getCouriers(req, res, next) {
  try {
    const couriers = await query('SELECT * FROM couriers ORDER BY name ASC');
    return res.json({ success: true, couriers });
  } catch (err) {
    next(err);
  }
}

async function createCourier(req, res, next) {
  try {
    const { name, service_type, contact_person, phone, email, tracking_url, api_endpoint, rate_card } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Courier provider name is required' });
    }

    const existing = await queryOne('SELECT id FROM couriers WHERE name = ?', [name]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Courier provider already exists' });
    }

    const result = await execute(`
      INSERT INTO couriers (name, service_type, contact_person, phone, email, tracking_url, api_endpoint, rate_card, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [name, service_type || null, contact_person || null, phone || null, email || null, tracking_url || null, api_endpoint || null, rate_card || null]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'couriers',
      entityId: result.lastInsertRowid,
      newValue: name,
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Courier provider created successfully', courierId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

async function updateCourier(req, res, next) {
  try {
    const { id } = req.params;
    const { name, service_type, contact_person, phone, email, tracking_url, api_endpoint, rate_card, active } = req.body;

    const courier = await queryOne('SELECT * FROM couriers WHERE id = ?', [id]);
    if (!courier) {
      return res.status(404).json({ success: false, message: 'Courier provider not found' });
    }

    await execute(`
      UPDATE couriers SET
        name = ?, service_type = ?, contact_person = ?, phone = ?, email = ?, tracking_url = ?, api_endpoint = ?, rate_card = ?, active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || courier.name,
      service_type !== undefined ? service_type : courier.service_type,
      contact_person !== undefined ? contact_person : courier.contact_person,
      phone !== undefined ? phone : courier.phone,
      email !== undefined ? email : courier.email,
      tracking_url !== undefined ? tracking_url : courier.tracking_url,
      api_endpoint !== undefined ? api_endpoint : courier.api_endpoint,
      rate_card !== undefined ? rate_card : courier.rate_card,
      active !== undefined ? Number(active) : courier.active,
      id
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'couriers',
      entityId: id,
      newValue: { name, active },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Courier provider updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCouriers,
  createCourier,
  updateCourier
};
