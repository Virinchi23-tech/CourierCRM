const { verifyToken } = require('../utils/jwt.utils');
const { queryOne } = require('../db/client');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }

  // Fetch full current active user
  const user = await queryOne('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ success: false, message: 'User account inactive or not found' });
  }

  req.user = user;
  next();
}

module.exports = {
  authenticateToken
};
