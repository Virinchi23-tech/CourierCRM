const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.post('/event', requireRole('ADMIN', 'OPERATIONS'), trackingController.addTrackingEvent);
router.post('/delivery', requireRole('ADMIN', 'OPERATIONS'), trackingController.recordDeliveryAndPOD);

module.exports = router;
