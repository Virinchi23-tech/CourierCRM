const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Webhook endpoints (Public for Meta WhatsApp Cloud API)
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhookEvent);

// Protected CRM routes
router.use(authenticateToken);
router.get('/conversations', requireRole('ADMIN', 'SALES'), whatsappController.getConversations);
router.get('/messages/:conversationId', requireRole('ADMIN', 'SALES'), whatsappController.getMessages);
router.post('/send', requireRole('ADMIN', 'SALES'), whatsappController.sendMessage);
router.get('/templates', requireRole('ADMIN', 'SALES'), whatsappController.getTemplates);

module.exports = router;
