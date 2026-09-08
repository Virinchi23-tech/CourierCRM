const { queryOne, execute } = require('../db/client');
const { comparePassword, hashPassword } = require('../utils/hash.utils');
const { generateToken } = require('../utils/jwt.utils');
const { logAudit } = require('../utils/audit.utils');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = generateToken(user);
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      ipAddress: req.ip
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      avatar_url: user.avatar_url
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      entity: 'users',
      entityId: req.user.id,
      ipAddress: req.ip
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await queryOne('SELECT id, name, email, role, mobile, avatar_url, last_login, created_at FROM users WHERE id = ?', [req.user.id]);
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await hashPassword(newPassword);
    await execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: req.user.id,
      newValue: 'Changed password',
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword
};
