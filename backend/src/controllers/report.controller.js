const { query, queryOne } = require('../db/client');

async function getDashboardMetrics(req, res, next) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Common KPI Cards
    const totalLeads = await queryOne('SELECT COUNT(*) as cnt FROM leads');
    const newLeadsToday = await queryOne('SELECT COUNT(*) as cnt FROM leads WHERE DATE(created_at) = DATE("now")');
    const qualifiedLeads = await queryOne('SELECT COUNT(*) as cnt FROM leads WHERE status = "QUALIFIED"');
    const convertedLeads = await queryOne('SELECT COUNT(*) as cnt FROM leads WHERE status IN ("QUALIFIED", "BOOKED")');
    const totalCustomers = await queryOne('SELECT COUNT(*) as cnt FROM customers');
    const totalQuotations = await queryOne('SELECT COUNT(*) as cnt FROM quotations');
    const totalBookings = await queryOne('SELECT COUNT(*) as cnt FROM bookings');
    const totalShipments = await queryOne('SELECT COUNT(*) as cnt FROM shipments');
    const shipmentsInTransit = await queryOne('SELECT COUNT(*) as cnt FROM shipments WHERE current_status IN ("IN_TRANSIT", "HANDED_TO_COURIER")');
    const deliveredShipments = await queryOne('SELECT COUNT(*) as cnt FROM shipments WHERE current_status = "DELIVERED"');
    const customsHold = await queryOne('SELECT COUNT(*) as cnt FROM shipments WHERE current_status = "CUSTOMS_HOLD"');
    const pendingPayments = await queryOne('SELECT SUM(amount) as total FROM payments WHERE status = "PENDING"');
    const paymentsReceived = await queryOne('SELECT SUM(amount) as total FROM payments WHERE status = "PAID"');

    // Leads by source
    const leadsBySource = await query('SELECT source, COUNT(*) as count FROM leads GROUP BY source');

    // Shipments by status
    const shipmentsByStatus = await query('SELECT current_status as status, COUNT(*) as count FROM shipments GROUP BY current_status');

    // Revenue by month (last 6 months)
    const revenueByMonth = await query(`
      SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue
      FROM payments WHERE status = 'PAID'
      GROUP BY month ORDER BY month DESC LIMIT 6
    `);

    // Destination countries
    const shipmentsByCountry = await query(`
      SELECT destination, COUNT(*) as count FROM shipments GROUP BY destination ORDER BY count DESC LIMIT 5
    `);

    // Salesperson performance
    const salesPerformance = await query(`
      SELECT u.name, COUNT(l.id) as leads_managed,
             SUM(CASE WHEN l.status IN ('QUALIFIED', 'BOOKED') THEN 1 ELSE 0 END) as converted
      FROM users u
      LEFT JOIN leads l ON u.id = l.assigned_to
      WHERE u.role IN ('SALES', 'ADMIN')
      GROUP BY u.id
    `);

    return res.json({
      success: true,
      role: userRole,
      kpi: {
        totalLeads: totalLeads?.cnt || 0,
        newLeadsToday: newLeadsToday?.cnt || 0,
        qualifiedLeads: qualifiedLeads?.cnt || 0,
        convertedLeads: convertedLeads?.cnt || 0,
        totalCustomers: totalCustomers?.cnt || 0,
        totalQuotations: totalQuotations?.cnt || 0,
        totalBookings: totalBookings?.cnt || 0,
        totalShipments: totalShipments?.cnt || 0,
        shipmentsInTransit: shipmentsInTransit?.cnt || 0,
        deliveredShipments: deliveredShipments?.cnt || 0,
        customsHold: customsHold?.cnt || 0,
        pendingPayments: pendingPayments?.total || 0,
        paymentsReceived: paymentsReceived?.total || 0
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
    const leadsReport = await query('SELECT status, source, COUNT(*) as count FROM leads GROUP BY status, source');
    const salesReport = await query(`
      SELECT q.status, COUNT(q.id) as total_quotations, SUM(q.total_amount) as total_value
      FROM quotations q GROUP BY q.status
    `);
    const courierReport = await query(`
      SELECT c.name as courier_name, COUNT(s.id) as shipment_count
      FROM couriers c LEFT JOIN shipments s ON c.id = s.courier_id
      GROUP BY c.id
    `);

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
