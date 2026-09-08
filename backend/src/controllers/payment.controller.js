const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getPayments(req, res, next) {
  try {
    const { search, page = 1, limit = 10, status, payment_method } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (p.payment_code LIKE ? OR c.name LIKE ? OR p.transaction_id LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (payment_method) {
      whereClause += ' AND p.payment_method = ?';
      params.push(payment_method);
    }

    const countRes = await queryOne(
      `SELECT COUNT(*) as total FROM payments p LEFT JOIN customers c ON p.customer_id = c.id WHERE ${whereClause}`, params
    );
    const total = countRes ? countRes.total : 0;

    const payments = await query(
      `SELECT p.*, c.name as customer_name, c.mobile as customer_mobile, b.booking_code, u.name as received_by_name
       FROM payments p
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN users u ON p.received_by = u.id
       WHERE ${whereClause}
       ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    // Summary calculations
    const summary = await queryOne(`
      SELECT 
        SUM(amount) as total_received,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as total_pending
      FROM payments
    `);

    return res.json({
      success: true,
      data: payments,
      summary: {
        totalReceived: summary?.total_received || 0,
        totalPaid: summary?.total_paid || 0,
        totalPending: summary?.total_pending || 0
      },
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

async function recordPayment(req, res, next) {
  try {
    const { customer_id, booking_id, amount, payment_method = 'UPI', transaction_id, notes, status = 'PAID', payment_date } = req.body;

    if (!customer_id || !amount) {
      return res.status(400).json({ success: false, message: 'Customer ID and amount are required' });
    }

    const paymentCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidDate = payment_date || new Date().toISOString().split('T')[0];

    const result = await execute(`
      INSERT INTO payments (payment_code, customer_id, booking_id, amount, payment_method, transaction_id, status, notes, received_by, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentCode, customer_id, booking_id || null, Number(amount), payment_method,
      transaction_id || null, status, notes || null, req.user.id, paidDate
    ]);

    // If linked to booking, update booking payment status
    if (booking_id && status === 'PAID') {
      await execute('UPDATE bookings SET payment_status = ? WHERE id = ?', ['PAID', booking_id]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'PAYMENT',
      entity: 'payments',
      entityId: result.lastInsertRowid,
      newValue: { paymentCode, customer_id, amount, payment_method },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      paymentId: result.lastInsertRowid,
      payment_code: paymentCode
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPayments,
  recordPayment
};
