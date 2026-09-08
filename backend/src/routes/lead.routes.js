const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES'), leadController.getLeads);
router.get('/:id', requireRole('ADMIN', 'SALES'), leadController.getLeadById);
router.post('/', requireRole('ADMIN', 'SALES'), leadController.createLead);
router.put('/:id', requireRole('ADMIN', 'SALES'), leadController.updateLead);
router.delete('/:id', requireRole('ADMIN'), leadController.deleteLead);

router.post('/bulk/assign', requireRole('ADMIN', 'SALES'), leadController.bulkAssignLeads);
router.post('/bulk/status', requireRole('ADMIN', 'SALES'), leadController.bulkStatusUpdate);
router.post('/:id/convert', requireRole('ADMIN', 'SALES'), leadController.convertLeadToCustomer);
router.post('/import/csv', requireRole('ADMIN', 'SALES'), leadController.processCsvImport);

module.exports = router;
