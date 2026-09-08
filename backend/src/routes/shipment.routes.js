const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES', 'OPERATIONS'), shipmentController.getShipments);
router.get('/:tracking_number', requireRole('ADMIN', 'SALES', 'OPERATIONS'), shipmentController.getShipmentByTracking);
router.post('/', requireRole('ADMIN', 'OPERATIONS', 'SALES'), shipmentController.createShipment);
router.put('/:id/status', requireRole('ADMIN', 'OPERATIONS'), shipmentController.updateShipmentStatus);

module.exports = router;
