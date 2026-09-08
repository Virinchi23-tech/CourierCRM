const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES'), quotationController.getQuotations);
router.get('/:id', requireRole('ADMIN', 'SALES'), quotationController.getQuotationById);
router.post('/', requireRole('ADMIN', 'SALES'), quotationController.createQuotation);
router.put('/:id/status', requireRole('ADMIN', 'SALES'), quotationController.updateQuotationStatus);
router.post('/:id/convert-booking', requireRole('ADMIN', 'SALES'), quotationController.convertQuotationToBooking);

module.exports = router;
