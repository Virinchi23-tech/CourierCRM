const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getShipments(req, res, next) {
  try {
    const { search, page = 1, limit = 10, status, courier_id, destination } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (s.tracking_number LIKE ? OR s.awb_number LIKE ? OR c.name LIKE ? OR s.destination LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      if (status === 'PENDING') {
        whereClause += " AND s.current_status IN ('BOOKED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED_AT_OFFICE', 'PACKAGING', 'READY_FOR_DISPATCH')";
      } else if (status === 'IN_TRANSIT') {
        whereClause += " AND s.current_status IN ('HANDED_TO_COURIER', 'IN_TRANSIT')";
      } else if (status === 'CUSTOMS') {
        whereClause += " AND s.current_status IN ('CUSTOMS_CLEARANCE', 'CUSTOMS_HOLD')";
      } else {
        whereClause += ' AND s.current_status = ?';
        params.push(status);
      }
    }

    if (courier_id) {
      whereClause += ' AND s.courier_id = ?';
      params.push(courier_id);
    }

    if (destination) {
      whereClause += ' AND s.destination LIKE ?';
      params.push(`%${destination}%`);
    }

    const countRes = await queryOne(
      `SELECT COUNT(*) as total FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE ${whereClause}`, params
    );
    const total = countRes ? countRes.total : 0;

    const shipments = await query(
      `SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, cr.name as courier_name, cr.tracking_url as courier_tracking_url
       FROM shipments s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN couriers cr ON s.courier_id = cr.id
       WHERE ${whereClause}
       ORDER BY s.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return res.json({
      success: true,
      data: shipments,
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

async function getShipmentByTracking(req, res, next) {
  try {
    const { tracking_number } = req.params;
    const shipment = await queryOne(`
      SELECT s.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, c.address as customer_address, cr.name as courier_name, cr.tracking_url
      FROM shipments s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN couriers cr ON s.courier_id = cr.id
      WHERE s.tracking_number = ? OR s.id = ? OR s.awb_number = ?
    `, [tracking_number, tracking_number, tracking_number]);

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // Packages list
    const packages = await query('SELECT * FROM packages WHERE shipment_id = ? ORDER BY package_number ASC', [shipment.id]);

    // Tracking events timeline
    const trackingEvents = await query('SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY event_date ASC', [shipment.id]);

    // Delivery & POD details
    const delivery = await queryOne('SELECT * FROM deliveries WHERE shipment_id = ?', [shipment.id]);

    return res.json({
      success: true,
      shipment,
      packages,
      trackingEvents,
      delivery
    });
  } catch (err) {
    next(err);
  }
}

async function createShipment(req, res, next) {
  try {
    const {
      booking_id, customer_id, courier_id, awb_number, service_type = 'International Express',
      origin = 'India', destination, package_count = 1, actual_weight = 0, volumetric_weight = 0,
      declared_value = 0, contents, expected_delivery_date
    } = req.body;

    if (!customer_id || !destination) {
      return res.status(400).json({ success: false, message: 'Customer selection and destination country/city are required' });
    }

    const trackingNumber = `ICC-${Math.floor(100000 + Math.random() * 900000)}-${destination.substring(0, 2).toUpperCase()}`;
    const calcChargeable = Math.max(Number(actual_weight), Number(volumetric_weight));

    const result = await execute(`
      INSERT INTO shipments (
        tracking_number, booking_id, customer_id, courier_id, awb_number, service_type,
        origin, destination, package_count, actual_weight, volumetric_weight, chargeable_weight,
        declared_value, contents, expected_delivery_date, current_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trackingNumber, booking_id || null, customer_id, courier_id || null, awb_number || null, service_type,
      origin, destination, Number(package_count), Number(actual_weight), Number(volumetric_weight), calcChargeable,
      Number(declared_value), contents || null, expected_delivery_date || null, 'BOOKED'
    ]);

    const shipmentId = result.lastInsertRowid;

    // Create Initial Package record
    await execute(`
      INSERT INTO packages (package_code, shipment_id, package_number, weight, volumetric_weight, contents, condition)
      VALUES (?, ?, 1, ?, ?, ?, 'GOOD')
    `, [`PKG-${shipmentId}-1`, shipmentId, Number(actual_weight), Number(volumetric_weight), contents || 'General Goods']);

    // Create Initial Tracking Event
    await execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, source)
      VALUES (?, 'BOOKED', ?, 'Shipment registered in CourierCRM', 'SYSTEM')
    `, [shipmentId, origin]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'shipments',
      entityId: shipmentId,
      newValue: { trackingNumber, destination, current_status: 'BOOKED' },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      shipmentId,
      tracking_number: trackingNumber
    });
  } catch (err) {
    next(err);
  }
}

async function updateShipmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { current_status, location, description, awb_number } = req.body;

    if (!current_status) {
      return res.status(400).json({ success: false, message: 'current_status is required' });
    }

    const shipment = await queryOne('SELECT * FROM shipments WHERE id = ? OR tracking_number = ?', [id, id]);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // Business rule check: Sales cannot modify completed operational records
    if (req.user.role === 'SALES' && ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(shipment.current_status)) {
      return res.status(403).json({ success: false, message: 'Sales users cannot modify completed shipment records' });
    }

    await execute(`
      UPDATE shipments SET
        current_status = ?,
        awb_number = COALESCE(?, awb_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [current_status, awb_number || null, shipment.id]);

    // Create Tracking Event
    await execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, source)
      VALUES (?, ?, ?, ?, ?)
    `, [
      shipment.id,
      current_status,
      location || shipment.destination,
      description || `Shipment status updated to ${current_status}`,
      req.user.role
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'SHIPMENT_UPDATE',
      entity: 'shipments',
      entityId: shipment.id,
      oldValue: shipment.current_status,
      newValue: current_status,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Shipment status updated to ${current_status}` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getShipments,
  getShipmentByTracking,
  createShipment,
  updateShipmentStatus
};
