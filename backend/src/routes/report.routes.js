const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/dashboard', reportController.getDashboardMetrics);
router.get('/detailed', requireRole('ADMIN', 'SALES'), reportController.getDetailedReports);

module.exports = router;
