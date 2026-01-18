/**
 * Auth Controller
 * Xử lý các request liên quan đến authentication
 */
const BaseController = require('./BaseController');
const AuthService = require('../services/AuthService');

class AuthController extends BaseController {
  /**
   * POST /api/auth/login - Đăng nhập
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return this.sendBadRequest(res, 'Username và password là bắt buộc');
      }

      const result = await AuthService.login(username, password);
      return this.sendSuccess(res, result, 'Đăng nhập thành công');
    } catch (error) {
      return this.sendUnauthorized(res, error.message);
    }
  }

  /**
   * POST /api/auth/register - Đăng ký
   */
  async register(req, res) {
    try {
      const { username, password, display_name, email } = req.body;

      if (!username || !password) {
        return this.sendBadRequest(res, 'Username và password là bắt buộc');
      }

      if (password.length < 4) {
        return this.sendBadRequest(res, 'Password phải có ít nhất 4 ký tự');
      }

      const user = await AuthService.register(username, password, display_name, email);
      return this.sendCreated(res, user, 'Đăng ký thành công');
    } catch (error) {
      return this.sendBadRequest(res, error.message);
    }
  }

  /**
   * GET /api/auth/me - Lấy thông tin user hiện tại
   */
  async getCurrentUser(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        return this.sendNotFound(res, 'User không tồn tại');
      }
      return this.sendSuccess(res, user);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * POST /api/auth/change-password - Đổi password
   */
  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return this.sendBadRequest(res, 'Current password và new password là bắt buộc');
      }

      if (new_password.length < 4) {
        return this.sendBadRequest(res, 'Password mới phải có ít nhất 4 ký tự');
      }

      await AuthService.changePassword(req.user.id, current_password, new_password);
      return this.sendSuccess(res, null, 'Đổi password thành công');
    } catch (error) {
      return this.sendBadRequest(res, error.message);
    }
  }
}

module.exports = new AuthController();
