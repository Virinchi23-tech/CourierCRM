const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getEnquiries(req, res, next) {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (enquiry_code LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ? OR destination_country LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const countRes = await queryOne(`SELECT COUNT(*) as total FROM enquiries WHERE ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const enquiries = await query(
      `SELECT e.*, c.name as customer_name, u.name as created_by_name
       FROM enquiries e
       LEFT JOIN customers c ON e.customer_id = c.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE ${whereClause}
       ORDER BY e.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return res.json({
      success: true,
      data: enquiries,
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

async function getEnquiryById(req, res, next) {
  try {
    const { id } = req.params;
    const enquiry = await queryOne(`
      SELECT e.*, c.name as customer_name, c.mobile as customer_mobile
      FROM enquiries e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.id = ? OR e.enquiry_code = ?
    `, [id, id]);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    return res.json({ success: true, enquiry });
  } catch (err) {
    next(err);
  }
}

async function createEnquiry(req, res, next) {
  try {
    const {
      customer_id, lead_id,
      sender_name, sender_mobile, sender_email, sender_address, sender_city, sender_state, sender_country = 'India', sender_pincode,
      receiver_name, receiver_mobile, receiver_email, receiver_address, receiver_city, receiver_state, receiver_country, receiver_postal_code,
      shipment_type = 'PARCEL', destination_country, destination_city, package_count = 1,
      actual_weight = 0, length = 0, width = 0, height = 0, contents, declared_value = 0, purpose, special_instructions
    } = req.body;

    if (!sender_name || !sender_mobile || !receiver_name || !receiver_address || !receiver_country) {
      return res.status(400).json({ success: false, message: 'Sender details and Receiver address/country are required' });
    }

    // Volumetric calculation (Length * Width * Height / 5000)
    const volumetric_weight = length > 0 && width > 0 && height > 0 ? (length * width * height) / 5000 : 0;
    const chargeable_weight = Math.max(Number(actual_weight), Number(volumetric_weight));
    const enquiryCode = `ENQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await execute(`
      INSERT INTO enquiries (
        enquiry_code, customer_id, lead_id, sender_name, sender_mobile, sender_email, sender_address, sender_city, sender_state, sender_country, sender_pincode,
        receiver_name, receiver_mobile, receiver_email, receiver_address, receiver_city, receiver_state, receiver_country, receiver_postal_code,
        shipment_type, destination_country, destination_city, package_count, actual_weight, length, width, height, volumetric_weight, chargeable_weight,
        contents, declared_value, purpose, special_instructions, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      enquiryCode, customer_id || null, lead_id || null, sender_name, sender_mobile, sender_email || null, sender_address || null, sender_city || null, sender_state || null, sender_country, sender_pincode || null,
      receiver_name, receiver_mobile, receiver_email || null, receiver_address, receiver_city || null, receiver_state || null, receiver_country, receiver_postal_code || null,
      shipment_type, destination_country || receiver_country, destination_city || receiver_city, Number(package_count), Number(actual_weight),
      Number(length), Number(width), Number(height), volumetric_weight, chargeable_weight,
      contents || null, Number(declared_value), purpose || null, special_instructions || null, 'PENDING', req.user.id
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'enquiries',
      entityId: result.lastInsertRowid,
      newValue: { enquiryCode, sender_name, receiver_name, destination_country },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      enquiryId: result.lastInsertRowid,
      enquiry_code: enquiryCode,
      volumetric_weight,
      chargeable_weight
    });
  } catch (err) {
    next(err);
  }
}

async function deleteEnquiry(req, res, next) {
  try {
    const { id } = req.params;
    await execute('DELETE FROM enquiries WHERE id = ?', [id]);
    await logAudit({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'enquiries',
      entityId: id,
      ipAddress: req.ip
    });
    return res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  deleteEnquiry
};
