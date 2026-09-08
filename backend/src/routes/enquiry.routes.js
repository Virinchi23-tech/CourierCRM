const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiry.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES'), enquiryController.getEnquiries);
router.get('/:id', requireRole('ADMIN', 'SALES'), enquiryController.getEnquiryById);
router.post('/', requireRole('ADMIN', 'SALES'), enquiryController.createEnquiry);
router.delete('/:id', requireRole('ADMIN'), enquiryController.deleteEnquiry);

module.exports = router;
