const { query, queryOne, execute } = require('../db/client');
const { hashPassword } = require('../utils/hash.utils');
const { logAudit } = require('../utils/audit.utils');

async function getUsers(req, res, next) {
  try {
    const users = await query(
      'SELECT id, name, email, role, mobile, status, avatar_url, last_login, created_at FROM users ORDER BY id DESC'
    );
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, mobile } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passHash = await hashPassword(password);
    const result = await execute(
      'INSERT INTO users (name, email, password_hash, role, mobile, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passHash, role, mobile || null, 'ACTIVE']
    );

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'users',
      entityId: result.lastInsertRowid,
      newValue: { name, email, role },
      ipAddress: req.ip
    });

    return res.status(201).json({ success: true, message: 'User created successfully', userId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, mobile, status } = req.body;

    const oldUser = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!oldUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await execute(
      'UPDATE users SET name = ?, role = ?, mobile = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || oldUser.name, role || oldUser.role, mobile !== undefined ? mobile : oldUser.mobile, status || oldUser.status, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'users',
      entityId: id,
      oldValue: { name: oldUser.name, role: oldUser.role, status: oldUser.status },
      newValue: { name, role, status },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser
};
