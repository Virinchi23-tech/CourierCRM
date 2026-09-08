const express = require('express');
const router = express.Router();
const followupController = require('../controllers/followup.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN', 'SALES'), followupController.getFollowups);
router.post('/', requireRole('ADMIN', 'SALES'), followupController.createFollowup);
router.put('/:id/status', requireRole('ADMIN', 'SALES'), followupController.updateFollowupStatus);

module.exports = router;
