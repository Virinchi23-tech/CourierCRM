const { query, queryOne } = require('../db/client');

async function getDashboardMetrics(req, res, next) {
  try {
    const userRole = req.user.role;

    // All queries use ? parameterized values — safe for Turso/libsql (no quote ambiguity)
    const totalLeads       = await queryOne('SELECT COUNT(*) as cnt FROM leads');
    const newLeadsToday    = await queryOne("SELECT COUNT(*) as cnt FROM leads WHERE DATE(created_at) = DATE('now')");
    const qualifiedLeads   = await queryOne('SELECT COUNT(*) as cnt FROM leads WHERE status = ?', ['QUALIFIED']);
    const convertedLeads   = await queryOne('SELECT COUNT(*) as cnt FROM leads WHERE status IN (?, ?)', ['QUALIFIED', 'BOOKED']);
    const totalCustomers   = await queryOne('SELECT COUNT(*) as cnt FROM customers');
    const totalQuotations  = await queryOne('SELECT COUNT(*) as cnt FROM quotations');
    const totalBookings    = await queryOne('SELECT COUNT(*) as cnt FROM bookings');
    const totalShipments   = await queryOne('SELECT COUNT(*) as cnt FROM shipments');

    const shipmentsInTransit = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status IN (?, ?)',
      ['IN_TRANSIT', 'HANDED_TO_COURIER']
    );
    const deliveredShipments = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status = ?',
      ['DELIVERED']
    );
    const customsHold = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status IN (?, ?)',
      ['CUSTOMS_HOLD', 'CUSTOMS_CLEARANCE']
    );
    const outForDelivery = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status = ?',
      ['OUT_FOR_DELIVERY']
    );
    const returnedShipments = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status = ?',
      ['RETURNED']
    );
    const pickupPending = await queryOne(
      'SELECT COUNT(*) as cnt FROM shipments WHERE current_status IN (?, ?, ?, ?, ?, ?)',
      ['BOOKED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED_AT_OFFICE', 'PACKAGING', 'READY_FOR_DISPATCH']
    );
    const pendingPayments  = await queryOne('SELECT SUM(amount) as total FROM payments WHERE status = ?', ['PENDING']);
    const paymentsReceived = await queryOne('SELECT SUM(amount) as total FROM payments WHERE status = ?', ['PAID']);

    // Leads by source
    const leadsBySource = await query('SELECT source, COUNT(*) as count FROM leads GROUP BY source');

    // Shipments by status
    const shipmentsByStatus = await query('SELECT current_status as status, COUNT(*) as count FROM shipments GROUP BY current_status');

    // Revenue by month (last 6 months) — ORDER ASC for correct chart direction
    const revenueByMonth = await query(
      "SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue FROM payments WHERE status = ? AND payment_date IS NOT NULL GROUP BY month ORDER BY month ASC LIMIT 6",
      ['PAID']
    );

    // Top destination countries
    const shipmentsByCountry = await query(
      'SELECT destination, COUNT(*) as count FROM shipments WHERE destination IS NOT NULL AND destination != ? GROUP BY destination ORDER BY count DESC LIMIT 5',
      ['']
    );

    // Salesperson performance
    const salesPerformance = await query(
      `SELECT u.name,
              COUNT(l.id) as leads_managed,
              SUM(CASE WHEN l.status IN ('QUALIFIED', 'BOOKED') THEN 1 ELSE 0 END) as converted
       FROM users u
       LEFT JOIN leads l ON u.id = l.assigned_to
       WHERE u.role IN ('SALES', 'ADMIN')
       GROUP BY u.id`
    );

    return res.json({
      success: true,
      role: userRole,
      kpi: {
        totalLeads:        Number(totalLeads?.cnt)        || 0,
        newLeadsToday:     Number(newLeadsToday?.cnt)     || 0,
        qualifiedLeads:    Number(qualifiedLeads?.cnt)    || 0,
        convertedLeads:    Number(convertedLeads?.cnt)    || 0,
        totalCustomers:    Number(totalCustomers?.cnt)    || 0,
        totalQuotations:   Number(totalQuotations?.cnt)   || 0,
        totalBookings:     Number(totalBookings?.cnt)     || 0,
        totalShipments:    Number(totalShipments?.cnt)    || 0,
        shipmentsInTransit: Number(shipmentsInTransit?.cnt) || 0,
        deliveredShipments: Number(deliveredShipments?.cnt) || 0,
        customsHold:        Number(customsHold?.cnt)      || 0,
        outForDelivery:     Number(outForDelivery?.cnt)   || 0,
        returnedShipments:  Number(returnedShipments?.cnt)|| 0,
        pickupPending:      Number(pickupPending?.cnt)    || 0,
        pendingPayments:    Number(pendingPayments?.total) || 0,
        paymentsReceived:   Number(paymentsReceived?.total)|| 0
      },
      charts: {
        leadsBySource,
        shipmentsByStatus,
        revenueByMonth,
        shipmentsByCountry,
        salesPerformance
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getDetailedReports(req, res, next) {
  try {
    const leadsReport = await query(
      'SELECT status, source, COUNT(*) as count FROM leads GROUP BY status, source ORDER BY count DESC'
    );
    const salesReport = await query(
      'SELECT q.status, COUNT(q.id) as total_quotations, SUM(q.total_amount) as total_value FROM quotations q GROUP BY q.status'
    );
    const courierReport = await query(
      'SELECT c.name as courier_name, COUNT(s.id) as shipment_count FROM couriers c LEFT JOIN shipments s ON c.id = s.courier_id GROUP BY c.id ORDER BY shipment_count DESC'
    );

    return res.json({
      success: true,
      leadsReport,
      salesReport,
      courierReport
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardMetrics,
  getDetailedReports
};
