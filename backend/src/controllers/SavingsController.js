/**
 * Savings Controller
 * Handle các request liên quan đến tiết kiệm
 */
const BaseController = require('./BaseController');
const SavingsService = require('../services/SavingsService');

class SavingsController extends BaseController {
  async getAll(req, res) {
    try {
      const books = await SavingsService.getAllBooks(req.user.id);
      return this.sendSuccess(res, books);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const book = await SavingsService.getBookDetail(parseInt(req.params.id), req.user.id);
      if (!book) return this.sendNotFound(res, 'Không tìm thấy sổ tiết kiệm');
      return this.sendSuccess(res, book);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req, res) {
    try {
      const { name, description, color } = req.body;
      if (!name) return this.sendBadRequest(res, 'Tên sổ tiết kiệm là bắt buộc');

      const book = await SavingsService.createBook({ name, description, color }, req.user.id);
      return this.sendCreated(res, book, 'Tạo sổ tiết kiệm thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req, res) {
    try {
      const book = await SavingsService.updateBook(parseInt(req.params.id), req.body, req.user.id);
      if (!book) return this.sendNotFound(res, 'Không tìm thấy sổ tiết kiệm');
      return this.sendSuccess(res, book, 'Cập nhật thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async delete(req, res) {
    try {
      const success = await SavingsService.deleteBook(parseInt(req.params.id), req.user.id);
      if (!success) return this.sendNotFound(res, 'Không tìm thấy sổ tiết kiệm');
      return this.sendSuccess(res, null, 'Xóa thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async addTransaction(req, res) {
    try {
      const { type, amount, interest_rate, transaction_date, notes } = req.body;
      if (!type || !amount || !transaction_date) {
        return this.sendBadRequest(res, 'Loại giao dịch, số tiền và ngày là bắt buộc');
      }
      if (!['deposit', 'withdrawal', 'interest'].includes(type)) {
        return this.sendBadRequest(res, 'Loại giao dịch không hợp lệ');
      }

      const tx = await SavingsService.addTransaction(
        parseInt(req.params.id),
        { type, amount, interest_rate, transaction_date, notes },
        req.user.id
      );
      return this.sendCreated(res, tx, 'Thêm giao dịch thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateTransaction(req, res) {
    try {
      const tx = await SavingsService.updateTransaction(parseInt(req.params.id), req.body, req.user.id);
      if (!tx) return this.sendNotFound(res, 'Không tìm thấy giao dịch');
      return this.sendSuccess(res, tx, 'Cập nhật giao dịch thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async deleteTransaction(req, res) {
    try {
      const success = await SavingsService.deleteTransaction(parseInt(req.params.id), req.user.id);
      if (!success) return this.sendNotFound(res, 'Không tìm thấy giao dịch');
      return this.sendSuccess(res, null, 'Xóa giao dịch thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new SavingsController();
