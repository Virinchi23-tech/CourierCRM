const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getCustomers(req, res, next) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ? OR customer_code LIKE ? OR company_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    const countRes = await queryOne(`SELECT COUNT(*) as total FROM customers WHERE ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const customers = await query(
      `SELECT * FROM customers WHERE ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return res.json({
      success: true,
      data: customers,
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

async function getCustomerProfile(req, res, next) {
  try {
    const { id } = req.params;
    const customer = await queryOne('SELECT * FROM customers WHERE id = ? OR customer_code = ?', [id, id]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const custId = customer.id;

    // 360 View Data
    const leads = await query('SELECT * FROM leads WHERE id = ?', [customer.lead_id || 0]);
    const enquiries = await query('SELECT * FROM enquiries WHERE customer_id = ? ORDER BY id DESC', [custId]);
    const quotations = await query('SELECT * FROM quotations WHERE customer_id = ? ORDER BY id DESC', [custId]);
    const bookings = await query('SELECT * FROM bookings WHERE customer_id = ? ORDER BY id DESC', [custId]);
    const payments = await query('SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC', [custId]);
    const shipments = await query(`
      SELECT s.*, c.name as courier_name 
      FROM shipments s 
      LEFT JOIN couriers c ON s.courier_id = c.id 
      WHERE s.customer_id = ? 
      ORDER BY s.id DESC
    `, [custId]);
    const followups = await query('SELECT * FROM lead_followups WHERE customer_id = ? ORDER BY id DESC', [custId]);
    const documents = await query('SELECT * FROM documents WHERE entity_type = "CUSTOMER" AND entity_id = ?', [custId]);

    return res.json({
      success: true,
      customer,
      leadHistory: leads,
      enquiries,
      quotations,
      bookings,
      payments,
      shipments,
      followups,
      documents
    });
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const { name, mobile, whatsapp_number, email, company_name, address, city, state, country, postal_code, notes } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Customer name and mobile number are required' });
    }

    const existing = await queryOne('SELECT id FROM customers WHERE mobile = ?', [mobile]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Customer with this mobile number already exists' });
    }

    const customerCode = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

    const resCust = await execute(`
      INSERT INTO customers (customer_code, name, mobile, whatsapp_number, email, company_name, address, city, state, country, postal_code, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerCode, name, mobile, whatsapp_number || mobile, email || null, company_name || null, address || null,
      city || null, state || null, country || 'India', postal_code || null, notes || null
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'customers',
      entityId: resCust.lastInsertRowid,
      newValue: { customerCode, name, mobile },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customerId: resCust.lastInsertRowid,
      customer_code: customerCode
    });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const oldCust = await queryOne('SELECT * FROM customers WHERE id = ?', [id]);
    if (!oldCust) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { name, mobile, whatsapp_number, email, company_name, address, city, state, country, postal_code, notes } = req.body;

    await execute(`
      UPDATE customers SET
        name = ?, mobile = ?, whatsapp_number = ?, email = ?, company_name = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name || oldCust.name,
      mobile || oldCust.mobile,
      whatsapp_number !== undefined ? whatsapp_number : oldCust.whatsapp_number,
      email !== undefined ? email : oldCust.email,
      company_name !== undefined ? company_name : oldCust.company_name,
      address !== undefined ? address : oldCust.address,
      city !== undefined ? city : oldCust.city,
      state !== undefined ? state : oldLead.state,
      country || oldCust.country,
      postal_code !== undefined ? postal_code : oldCust.postal_code,
      notes !== undefined ? notes : oldCust.notes,
      id
    ]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'customers',
      entityId: id,
      oldValue: oldCust.name,
      newValue: name,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Customer updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCustomers,
  getCustomerProfile,
  createCustomer,
  updateCustomer
};
