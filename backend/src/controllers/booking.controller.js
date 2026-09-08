const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getBookings(req, res, next) {
  try {
    const { search, page = 1, limit = 10, status, payment_status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (b.booking_code LIKE ? OR c.name LIKE ? OR cr.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      whereClause += ' AND b.booking_status = ?';
      params.push(status);
    }

    if (payment_status) {
      whereClause += ' AND b.payment_status = ?';
      params.push(payment_status);
    }

    const countRes = await queryOne(
      `SELECT COUNT(*) as total FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE ${whereClause}`, params
    );
    const total = countRes ? countRes.total : 0;

    const bookings = await query(
      `SELECT b.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, cr.name as courier_name, q.total_amount, q.quotation_code, u.name as created_by_name
       FROM bookings b
       LEFT JOIN customers c ON b.customer_id = c.id
       LEFT JOIN couriers cr ON b.courier_id = cr.id
       LEFT JOIN quotations q ON b.quotation_id = q.id
       LEFT JOIN users u ON b.created_by = u.id
       WHERE ${whereClause}
       ORDER BY b.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return res.json({
      success: true,
      data: bookings,
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

async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await queryOne(`
      SELECT b.*, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email, cr.name as courier_name, q.total_amount, q.quotation_code
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN couriers cr ON b.courier_id = cr.id
      LEFT JOIN quotations q ON b.quotation_id = q.id
      WHERE b.id = ? OR b.booking_code = ?
    `, [id, id]);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { booking_status, payment_status } = req.body;

    const booking = await queryOne('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await execute(
      'UPDATE bookings SET booking_status = ?, payment_status = ? WHERE id = ?',
      [booking_status || booking.booking_status, payment_status || booking.payment_status, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'STATUS_CHANGE',
      entity: 'bookings',
      entityId: id,
      oldValue: { booking_status: booking.booking_status, payment_status: booking.payment_status },
      newValue: { booking_status, payment_status },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBookings,
  getBookingById,
  updateBookingStatus
};
