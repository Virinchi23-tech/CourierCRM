const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/shipment/:shipmentId', requireRole('ADMIN', 'OPERATIONS', 'SALES'), packageController.getPackagesByShipment);
router.post('/', requireRole('ADMIN', 'OPERATIONS'), packageController.addPackage);
router.put('/:id/receive', requireRole('ADMIN', 'OPERATIONS'), packageController.receivePackageAtOffice);

module.exports = router;
