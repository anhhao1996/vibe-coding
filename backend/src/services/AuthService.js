/**
 * Auth Service
 * Xử lý authentication và authorization
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'investment-tracker-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Đăng ký user mới
   */
  async register(username, password, displayName, email) {
    // Check username đã tồn tại chưa
    const existing = await db.query(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    
    if (existing.length > 0) {
      throw new Error('Username đã tồn tại');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (username, password, display_name, email) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, displayName || username, email]
    );

    return {
      id: result.insertId,
      username,
      display_name: displayName || username,
      email
    };
  }

  /**
   * Đăng nhập
   */
  async login(username, password) {
    // Tìm user
    const users = await db.query(
      'SELECT * FROM users WHERE username = ?', [username]
    );

    if (!users || users.length === 0) {
      throw new Error('Username hoặc password không đúng');
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Username hoặc password không đúng');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        display_name: user.display_name 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email
      }
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token không hợp lệ');
    }
  }

  /**
   * Lấy thông tin user theo ID
   */
  async getUserById(id) {
    const users = await db.query(
      'SELECT id, username, display_name, email, created_at FROM users WHERE id = ?', 
      [id]
    );
    return users[0] || null;
  }

  /**
   * Đổi password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Lấy user
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      throw new Error('User không tồn tại');
    }

    const user = users[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Password hiện tại không đúng');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    return true;
  }
}

module.exports = new AuthService();
