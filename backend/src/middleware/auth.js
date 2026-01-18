/**
 * Auth Middleware
 * Xác thực JWT token
 */
const AuthService = require('../services/AuthService');

/**
 * Middleware bắt buộc đăng nhập
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

/**
 * Middleware tùy chọn - không bắt buộc đăng nhập
 * Nếu có token thì verify, không có thì bỏ qua
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Token không hợp lệ thì bỏ qua
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
