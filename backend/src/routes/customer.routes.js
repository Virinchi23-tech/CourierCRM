const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES', 'OPERATIONS'), customerController.getCustomers);
router.get('/:id', requireRole('ADMIN', 'SALES', 'OPERATIONS'), customerController.getCustomerProfile);
router.post('/', requireRole('ADMIN', 'SALES'), customerController.createCustomer);
router.put('/:id', requireRole('ADMIN', 'SALES'), customerController.updateCustomer);

module.exports = router;
