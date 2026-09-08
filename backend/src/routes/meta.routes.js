const express = require('express');
const router = express.Router();
const metaController = require('../controllers/meta.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Public Webhook endpoints for Meta Lead Ads
router.get('/webhook', metaController.verifyMetaWebhook);
router.post('/webhook', metaController.handleMetaLeadWebhook);

// Protected CRM routes
router.use(authenticateToken);
router.get('/leads', requireRole('ADMIN', 'SALES'), metaController.getMetaLeads);

module.exports = router;
