const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES', 'OPERATIONS'), paymentController.getPayments);
router.post('/', requireRole('ADMIN', 'SALES'), paymentController.recordPayment);

module.exports = router;
