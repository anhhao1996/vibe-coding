/**
 * Auth Service
 * Xử lý authentication và authorization
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'investment-tracker-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  async register(username, password, displayName, email) {
    const existing = await User.findByUsername(username);
    if (existing) {
      throw new Error('Username đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      display_name: displayName || username,
      email
    });

    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: user.email
    };
  }

  async login(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error('Username hoặc password không đúng');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Username hoặc password không đúng');
    }

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

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token không hợp lệ');
    }
  }

  async getUserById(id) {
    return User.findPublicById(id);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User không tồn tại');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Password hiện tại không đúng');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(userId, hashedPassword);

    return true;
  }
}

module.exports = new AuthService();
