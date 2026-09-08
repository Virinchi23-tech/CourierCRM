const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function addTrackingEvent(req, res, next) {
  try {
    const { shipment_id, status, location, description, source = 'MANUAL' } = req.body;

    if (!shipment_id || !status) {
      return res.status(400).json({ success: false, message: 'shipment_id and status are required' });
    }

    const result = await execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, source)
      VALUES (?, ?, ?, ?, ?)
    `, [shipment_id, status, location || null, description || null, source]);

    // Update main shipment status
    await execute('UPDATE shipments SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, shipment_id]);

    await logAudit({
      userId: req.user.id,
      action: 'SHIPMENT_UPDATE',
      entity: 'tracking_events',
      entityId: result.lastInsertRowid,
      newValue: { shipment_id, status, location },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'Tracking event added successfully', eventId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

async function recordDeliveryAndPOD(req, res, next) {
  try {
    const { shipment_id, delivery_date, delivery_time, received_by, signature, pod_file, delivery_notes } = req.body;

    if (!shipment_id || !received_by) {
      return res.status(400).json({ success: false, message: 'shipment_id and received_by name are required' });
    }

    const shipment = await queryOne('SELECT * FROM shipments WHERE id = ?', [shipment_id]);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const existingDel = await queryOne('SELECT id FROM deliveries WHERE shipment_id = ?', [shipment_id]);
    if (existingDel) {
      await execute(`
        UPDATE deliveries SET
          delivery_date = ?, delivery_time = ?, received_by = ?, signature = ?, pod_file = ?, delivery_notes = ?
        WHERE shipment_id = ?
      `, [delivery_date || '2026-09-08', delivery_time || '12:00:00', received_by, signature || null, pod_file || null, delivery_notes || null, shipment_id]);
    } else {
      await execute(`
        INSERT INTO deliveries (shipment_id, delivery_date, delivery_time, received_by, signature, pod_file, delivery_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [shipment_id, delivery_date || '2026-09-08', delivery_time || '12:00:00', received_by, signature || null, pod_file || null, delivery_notes || null]);
    }

    // Update shipment status to DELIVERED
    await execute('UPDATE shipments SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['DELIVERED', shipment_id]);

    // Add final tracking event
    await execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, source)
      VALUES (?, 'DELIVERED', ?, ?, 'OPERATIONS')
    `, [shipment_id, shipment.destination, `Package delivered to ${received_by}. Proof of delivery recorded.`]);

    await logAudit({
      userId: req.user.id,
      action: 'DELIVERY',
      entity: 'deliveries',
      entityId: shipment_id,
      newValue: { received_by, delivery_date },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Delivery and Proof of Delivery (POD) recorded successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addTrackingEvent,
  recordDeliveryAndPOD
};
