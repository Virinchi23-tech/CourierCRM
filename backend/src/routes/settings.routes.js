const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), settingsController.getSettings);
router.put('/', requireRole('ADMIN'), settingsController.updateSetting);
router.get('/audit-logs', requireRole('ADMIN'), settingsController.getAuditLogs);

module.exports = router;
