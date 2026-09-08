const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getPackagesByShipment(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const packages = await query('SELECT * FROM packages WHERE shipment_id = ? ORDER BY package_number ASC', [shipmentId]);
    return res.json({ success: true, packages });
  } catch (err) {
    next(err);
  }
}

async function addPackage(req, res, next) {
  try {
    const { shipment_id, package_number, weight = 0, length = 0, width = 0, height = 0, contents, declared_value = 0, condition = 'GOOD', notes } = req.body;

    if (!shipment_id) {
      return res.status(400).json({ success: false, message: 'shipment_id is required' });
    }

    const volumetric_weight = (length * width * height) > 0 ? (length * width * height) / 5000 : 0;
    const packageCode = `PKG-${shipment_id}-${package_number || Math.floor(Math.random() * 100)}`;

    const result = await execute(`
      INSERT INTO packages (package_code, shipment_id, package_number, weight, length, width, height, volumetric_weight, contents, declared_value, condition, received_at, received_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `, [
      packageCode, shipment_id, package_number || 1, Number(weight), Number(length), Number(width), Number(height),
      volumetric_weight, contents || null, Number(declared_value), condition, req.user.id, notes || null
    ]);

    // Recalculate Total Shipment Weight & Package Count
    const packageStats = await queryOne(`
      SELECT COUNT(*) as total_pkgs, SUM(weight) as total_weight, SUM(volumetric_weight) as total_vol_weight
      FROM packages WHERE shipment_id = ?
    `, [shipment_id]);

    if (packageStats) {
      const chargeable = Math.max(Number(packageStats.total_weight), Number(packageStats.total_vol_weight));
      await execute(`
        UPDATE shipments SET
          package_count = ?,
          actual_weight = ?,
          volumetric_weight = ?,
          chargeable_weight = ?
        WHERE id = ?
      `, [packageStats.total_pkgs, packageStats.total_weight, packageStats.total_vol_weight, chargeable, shipment_id]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'packages',
      entityId: result.lastInsertRowid,
      newValue: { packageCode, weight, condition },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Package added and shipment weights updated',
      packageId: result.lastInsertRowid,
      package_code: packageCode
    });
  } catch (err) {
    next(err);
  }
}

async function receivePackageAtOffice(req, res, next) {
  try {
    const { id } = req.params;
    const { weight, length, width, height, condition, photo_url, notes } = req.body;

    const pkg = await queryOne('SELECT * FROM packages WHERE id = ?', [id]);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const volumetric_weight = (length * width * height) > 0 ? (length * width * height) / 5000 : pkg.volumetric_weight;

    await execute(`
      UPDATE packages SET
        weight = COALESCE(?, weight),
        length = COALESCE(?, length),
        width = COALESCE(?, width),
        height = COALESCE(?, height),
        volumetric_weight = ?,
        condition = COALESCE(?, condition),
        photo_url = COALESCE(?, photo_url),
        notes = COALESCE(?, notes),
        received_at = CURRENT_TIMESTAMP,
        received_by = ?
      WHERE id = ?
    `, [
      weight ? Number(weight) : null,
      length ? Number(length) : null,
      width ? Number(width) : null,
      height ? Number(height) : null,
      volumetric_weight,
      condition || null,
      photo_url || null,
      notes || null,
      req.user.id,
      id
    ]);

    // Update Shipment status to RECEIVED_AT_OFFICE if currently BOOKED or PICKED_UP
    await execute(`
      UPDATE shipments SET
        current_status = 'RECEIVED_AT_OFFICE',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND current_status IN ('BOOKED', 'PICKUP_SCHEDULED', 'PICKED_UP')
    `, [pkg.shipment_id]);

    await execute(`
      INSERT INTO tracking_events (shipment_id, status, location, description, source)
      VALUES (?, 'RECEIVED_AT_OFFICE', 'Operations Hub', 'Package received & weighed at central operations office', 'OPERATIONS')
    `, [pkg.shipment_id]);

    return res.json({ success: true, message: 'Package marked as received at office with verified metrics' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPackagesByShipment,
  addPackage,
  receivePackageAtOffice
};
