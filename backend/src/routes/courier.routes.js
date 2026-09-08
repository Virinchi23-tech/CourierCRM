const express = require('express');
const router = express.Router();
const courierController = require('../controllers/courier.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES', 'OPERATIONS'), courierController.getCouriers);
router.post('/', requireRole('ADMIN'), courierController.createCourier);
router.put('/:id', requireRole('ADMIN'), courierController.updateCourier);

module.exports = router;
