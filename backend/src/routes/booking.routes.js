const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES', 'OPERATIONS'), bookingController.getBookings);
router.get('/:id', requireRole('ADMIN', 'SALES', 'OPERATIONS'), bookingController.getBookingById);
router.put('/:id/status', requireRole('ADMIN', 'SALES', 'OPERATIONS'), bookingController.updateBookingStatus);

module.exports = router;
