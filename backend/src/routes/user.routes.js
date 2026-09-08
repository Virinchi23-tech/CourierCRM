const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), userController.getUsers);
router.post('/', requireRole('ADMIN'), userController.createUser);
router.put('/:id', requireRole('ADMIN'), userController.updateUser);

module.exports = router;
