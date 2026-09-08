const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getQuotations(req, res, next) {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (q.quotation_code LIKE ? OR c.name LIKE ? OR cr.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClause += ' AND q.status = ?';
      params.push(status);
    }

    const countRes = await queryOne(
      `SELECT COUNT(*) as total 
       FROM quotations q 
       LEFT JOIN customers c ON q.customer_id = c.id 
       LEFT JOIN couriers cr ON q.courier_id = cr.id 
       WHERE ${whereClause}`, params
    );
    const total = countRes ? countRes.total : 0;

    const quotations = await query(
      `SELECT q.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, cr.name as courier_name, u.name as created_by_name
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN couriers cr ON q.courier_id = cr.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE ${whereClause}
       ORDER BY q.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return res.json({
      success: true,
      data: quotations,
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

async function getQuotationById(req, res, next) {
  try {
    const { id } = req.params;
    const quotation = await queryOne(`
      SELECT q.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, c.address as customer_address, cr.name as courier_name, e.destination_country, e.contents
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN couriers cr ON q.courier_id = cr.id
      LEFT JOIN enquiries e ON q.enquiry_id = e.id
      WHERE q.id = ? OR q.quotation_code = ?
    `, [id, id]);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const items = await query('SELECT * FROM quotation_items WHERE quotation_id = ?', [quotation.id]);

    return res.json({ success: true, quotation, items });
  } catch (err) {
    next(err);
  }
}

async function createQuotation(req, res, next) {
  try {
    const {
      customer_id, enquiry_id, courier_id, service_type = 'International Express',
      actual_weight = 0, volumetric_weight = 0, chargeable_weight = 0,
      base_rate = 0, shipping_charge = 0, pickup_charge = 0, packing_charge = 0, customs_charge = 0, other_charge = 0,
      discount = 0, tax = 0, valid_until, status = 'DRAFT'
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'Customer selection is required' });
    }

    const calcChargeable = Math.max(Number(chargeable_weight), Math.max(Number(actual_weight), Number(volumetric_weight)));
    const calculatedSubtotal = Number(shipping_charge || (calcChargeable * base_rate)) + Number(pickup_charge) + Number(packing_charge) + Number(customs_charge) + Number(other_charge) - Number(discount);
    const taxAmount = tax > 0 ? Number(tax) : (calculatedSubtotal * 0.18); // 18% GST default
    const total_amount = calculatedSubtotal + taxAmount;

    const quotationCode = `QT-${Math.floor(100000 + Math.random() * 900000)}`;

    const result = await execute(`
      INSERT INTO quotations (
        quotation_code, customer_id, enquiry_id, courier_id, service_type,
        actual_weight, volumetric_weight, chargeable_weight,
        base_rate, shipping_charge, pickup_charge, packing_charge, customs_charge, other_charge,
        discount, tax, total_amount, valid_until, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quotationCode, customer_id, enquiry_id || null, courier_id || null, service_type,
      Number(actual_weight), Number(volumetric_weight), calcChargeable,
      Number(base_rate), Number(shipping_charge || (calcChargeable * base_rate)), Number(pickup_charge), Number(packing_charge), Number(customs_charge), Number(other_charge),
      Number(discount), taxAmount, total_amount, valid_until || null, status, req.user.id
    ]);

    const quotationId = result.lastInsertRowid;

    // If linked to enquiry, update enquiry status
    if (enquiry_id) {
      await execute('UPDATE enquiries SET status = ? WHERE id = ?', ['QUOTED', enquiry_id]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'quotations',
      entityId: quotationId,
      newValue: { quotationCode, customer_id, total_amount },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Quotation generated successfully',
      quotationId,
      quotation_code: quotationCode,
      total_amount
    });
  } catch (err) {
    next(err);
  }
}

async function updateQuotationStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const quote = await queryOne('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await execute('UPDATE quotations SET status = ? WHERE id = ?', [status, id]);

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGE',
      entity: 'quotations',
      entityId: id,
      oldValue: quote.status,
      newValue: status,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Quotation status updated to ${status}` });
  } catch (err) {
    next(err);
  }
}

async function convertQuotationToBooking(req, res, next) {
  try {
    const { id } = req.params;
    const { pickup_date, pickup_address, special_instructions } = req.body;

    const quote = await queryOne('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Check if booking already exists
    const existing = await queryOne('SELECT id, booking_code FROM bookings WHERE quotation_id = ?', [id]);
    if (existing) {
      return res.json({
        success: true,
        message: 'Booking already created for this quotation',
        bookingId: existing.id,
        booking_code: existing.booking_code
      });
    }

    const bookingCode = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const resBook = await execute(`
      INSERT INTO bookings (
        booking_code, customer_id, quotation_id, enquiry_id, pickup_date, pickup_address,
        service_type, courier_id, payment_status, booking_status, special_instructions, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bookingCode, quote.customer_id, quote.id, quote.enquiry_id,
      pickup_date || '2026-09-10', pickup_address || 'Customer Office Pickup',
      quote.service_type, quote.courier_id, 'PENDING', 'CONFIRMED', special_instructions || null, req.user.id
    ]);

    // Update Quotation status to ACCEPTED
    await execute('UPDATE quotations SET status = ? WHERE id = ?', ['ACCEPTED', id]);

    await logAudit({
      userId: req.user.id,
      action: 'BOOKING',
      entity: 'bookings',
      entityId: resBook.lastInsertRowid,
      newValue: { bookingCode, quotationId: id },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Quotation converted to Booking successfully',
      bookingId: resBook.lastInsertRowid,
      booking_code: bookingCode
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  convertQuotationToBooking
};
