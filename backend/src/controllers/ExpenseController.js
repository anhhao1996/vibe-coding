/**
 * Expense Controller
 * Handle các request liên quan đến chi tiêu
 */
const BaseController = require('./BaseController');
const ExpenseService = require('../services/ExpenseService');

class ExpenseController extends BaseController {
  /**
   * Lấy tất cả chi tiêu hàng tháng
   */
  async getAll(req, res) {
    try {
      const expenses = await ExpenseService.getAllMonthlyExpenses(req.user.id);
      return this.sendSuccess(res, expenses);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy chi tiêu theo tháng
   */
  async getByMonth(req, res) {
    try {
      const { month } = req.params;
      const expense = await ExpenseService.getMonthlyExpense(month, req.user.id);
      
      if (!expense) {
        return this.sendNotFound(res, `Không tìm thấy dữ liệu tháng ${month}`);
      }
      
      return this.sendSuccess(res, expense);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy chi tiêu theo ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const expense = await ExpenseService.getMonthlyExpenseById(id, req.user.id);
      
      if (!expense) {
        return this.sendNotFound(res, 'Không tìm thấy chi tiêu');
      }
      
      return this.sendSuccess(res, expense);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Tạo chi tiêu tháng mới
   */
  async createMonth(req, res) {
    try {
      const { month, notes } = req.body;
      
      if (!month) {
        return this.sendBadRequest(res, 'Tháng là bắt buộc');
      }
      
      const expense = await ExpenseService.createOrUpdateMonth(month, notes, req.user.id);
      return this.sendCreated(res, expense, 'Tạo chi tiêu tháng thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Thêm khoản chi tiêu
   */
  async addItem(req, res) {
    try {
      const { monthlyExpenseId } = req.params;
      const { name, amount, notes } = req.body;
      
      if (!name) {
        return this.sendBadRequest(res, 'Tên khoản chi là bắt buộc');
      }
      
      const item = await ExpenseService.addExpenseItem(parseInt(monthlyExpenseId), {
        name,
        amount: parseFloat(amount) || 0,
        notes
      });
      
      return this.sendCreated(res, item, 'Thêm khoản chi tiêu thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Cập nhật khoản chi tiêu
   */
  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { name, amount, notes } = req.body;
      
      const item = await ExpenseService.updateExpenseItem(parseInt(id), {
        name,
        amount: parseFloat(amount),
        notes
      });
      
      if (!item) {
        return this.sendNotFound(res, 'Không tìm thấy khoản chi tiêu');
      }
      
      return this.sendSuccess(res, item, 'Cập nhật thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Xóa khoản chi tiêu
   */
  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const success = await ExpenseService.deleteExpenseItem(parseInt(id));
      
      if (!success) {
        return this.sendNotFound(res, 'Không tìm thấy khoản chi tiêu');
      }
      
      return this.sendSuccess(res, null, 'Xóa thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Copy từ tháng trước
   */
  async copyFromMonth(req, res) {
    try {
      const { sourceMonth, targetMonth } = req.body;
      
      if (!sourceMonth || !targetMonth) {
        return this.sendBadRequest(res, 'Cần có tháng nguồn và tháng đích');
      }
      
      const expense = await ExpenseService.copyFromPreviousMonth(sourceMonth, targetMonth, req.user.id);
      return this.sendSuccess(res, expense, `Đã copy dữ liệu từ ${sourceMonth} sang ${targetMonth}`);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy xu hướng chi tiêu
   */
  async getTrend(req, res) {
    try {
      const months = parseInt(req.query.months) || 12;
      const trend = await ExpenseService.getMonthlyTrend(months, req.user.id);
      return this.sendSuccess(res, trend);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy xu hướng theo tên khoản chi
   */
  async getItemTrend(req, res) {
    try {
      const { itemName } = req.params;
      const months = parseInt(req.query.months) || 12;
      const trend = await ExpenseService.getItemTrend(decodeURIComponent(itemName), months, req.user.id);
      return this.sendSuccess(res, trend);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy danh sách tên khoản chi tiêu unique
   */
  async getUniqueItemNames(req, res) {
    try {
      const itemNames = await ExpenseService.getAllUniqueItemNames(req.user.id);
      return this.sendSuccess(res, itemNames);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy xu hướng nhiều khoản chi
   */
  async getMultipleItemsTrend(req, res) {
    try {
      const { items } = req.body;
      const months = parseInt(req.query.months) || 12;
      
      if (!items || !Array.isArray(items)) {
        return this.sendBadRequest(res, 'Cần danh sách tên khoản chi');
      }
      
      const trends = await ExpenseService.getMultipleItemsTrend(items, months, req.user.id);
      return this.sendSuccess(res, trends);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Xóa toàn bộ chi tiêu tháng
   */
  async deleteMonth(req, res) {
    try {
      const { month } = req.params;
      const success = await ExpenseService.deleteMonth(month, req.user.id);
      
      if (!success) {
        return this.sendNotFound(res, `Không tìm thấy dữ liệu tháng ${month}`);
      }
      
      return this.sendSuccess(res, null, 'Xóa thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy danh sách tracked items của user
   */
  async getTrackedItems(req, res) {
    try {
      const items = await ExpenseService.getTrackedItems(req.user.id);
      return this.sendSuccess(res, items);
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lưu danh sách tracked items của user
   */
  async saveTrackedItems(req, res) {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        return this.sendBadRequest(res, 'Items phải là một array');
      }
      
      const savedItems = await ExpenseService.saveTrackedItems(req.user.id, items);
      return this.sendSuccess(res, savedItems, 'Đã lưu thành công');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new ExpenseController();
