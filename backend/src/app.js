const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const customerRoutes = require('./routes/customer.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const quotationRoutes = require('./routes/quotation.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const packageRoutes = require('./routes/package.routes');
const courierRoutes = require('./routes/courier.routes');
const trackingRoutes = require('./routes/tracking.routes');
const followupRoutes = require('./routes/followup.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const metaRoutes = require('./routes/meta.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    name: 'International Courier CRM API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/couriers', courierRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
