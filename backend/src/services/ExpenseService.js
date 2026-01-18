/**
 * Expense Service
 * Business logic cho quản lý chi tiêu
 */
const MonthlyExpense = require('../models/MonthlyExpense');
const ExpenseItem = require('../models/ExpenseItem');
const UserSettings = require('../models/UserSettings');

// Setting key cho tracked expense items
const TRACKED_ITEMS_KEY = 'expense_tracked_items';

class ExpenseService {
  /**
   * Lấy tất cả chi tiêu hàng tháng
   */
  async getAllMonthlyExpenses(userId) {
    return await MonthlyExpense.findAllWithTotal(userId);
  }

  /**
   * Lấy chi tiêu theo tháng với chi tiết
   */
  async getMonthlyExpense(month, userId) {
    const expense = await MonthlyExpense.findByMonth(month, userId);
    if (!expense) return null;

    const itemsSql = `
      SELECT * FROM expense_items 
      WHERE monthly_expense_id = ? 
      ORDER BY created_at ASC
    `;
    const items = await MonthlyExpense.db.query(itemsSql, [expense.id]);
    
    return { ...expense, items };
  }

  /**
   * Lấy chi tiêu theo ID
   */
  async getMonthlyExpenseById(id, userId) {
    const expense = await MonthlyExpense.findById(id);
    if (!expense || expense.user_id !== userId) return null;
    
    return await MonthlyExpense.findWithItems(id);
  }

  /**
   * Tạo hoặc cập nhật chi tiêu tháng
   */
  async createOrUpdateMonth(month, notes = '', userId) {
    let expense = await MonthlyExpense.findByMonth(month, userId);
    
    if (!expense) {
      // BaseModel.create đã trả về object đầy đủ
      expense = await MonthlyExpense.create({
        user_id: userId,
        month,
        total_amount: 0,
        notes
      });
    } else if (notes) {
      await MonthlyExpense.update(expense.id, { notes });
    }
    
    return expense;
  }

  /**
   * Thêm khoản chi tiêu
   */
  async addExpenseItem(monthlyExpenseId, data) {
    // BaseModel.create đã trả về object đầy đủ
    const item = await ExpenseItem.create({
      monthly_expense_id: monthlyExpenseId,
      name: data.name,
      amount: data.amount || 0,
      notes: data.notes || ''
    });

    // Cập nhật tổng chi tiêu
    await MonthlyExpense.updateTotalAmount(monthlyExpenseId);
    
    return item;
  }

  /**
   * Cập nhật khoản chi tiêu
   */
  async updateExpenseItem(id, data) {
    const item = await ExpenseItem.findById(id);
    if (!item) return null;

    await ExpenseItem.update(id, {
      name: data.name,
      amount: data.amount,
      notes: data.notes
    });

    // Cập nhật tổng chi tiêu
    await MonthlyExpense.updateTotalAmount(item.monthly_expense_id);
    
    return await ExpenseItem.findById(id);
  }

  /**
   * Xóa khoản chi tiêu
   */
  async deleteExpenseItem(id) {
    const item = await ExpenseItem.findById(id);
    if (!item) return false;

    const monthlyExpenseId = item.monthly_expense_id;
    await ExpenseItem.delete(id);

    // Cập nhật tổng chi tiêu
    await MonthlyExpense.updateTotalAmount(monthlyExpenseId);
    
    return true;
  }

  /**
   * Copy chi tiêu từ tháng cũ sang tháng mới
   */
  async copyFromPreviousMonth(sourceMonth, targetMonth, userId) {
    // Lấy tháng nguồn với items
    const sourceExpense = await this.getMonthlyExpense(sourceMonth, userId);
    if (!sourceExpense) {
      throw new Error(`Không tìm thấy dữ liệu tháng ${sourceMonth}`);
    }

    // Tạo hoặc lấy tháng đích
    let targetExpense = await MonthlyExpense.findByMonth(targetMonth, userId);
    if (!targetExpense) {
      // BaseModel.create đã trả về object đầy đủ với id
      targetExpense = await MonthlyExpense.create({
        user_id: userId,
        month: targetMonth,
        total_amount: 0,
        notes: `Copy từ tháng ${sourceMonth}`
      });
    }

    // Copy các items (targetExpense.id đã có sẵn)
    await ExpenseItem.copyFromMonth(sourceExpense.id, targetExpense.id);

    // Cập nhật tổng
    await MonthlyExpense.updateTotalAmount(targetExpense.id);

    return await this.getMonthlyExpenseById(targetExpense.id, userId);
  }

  /**
   * Lấy xu hướng chi tiêu theo tháng
   */
  async getMonthlyTrend(months = 12, userId) {
    return await MonthlyExpense.getMonthlyTrend(months, userId);
  }

  /**
   * Lấy xu hướng chi tiêu theo tên khoản chi
   */
  async getItemTrend(itemName, months = 12, userId) {
    return await MonthlyExpense.getItemTrendByName(itemName, months, userId);
  }

  /**
   * Lấy xu hướng nhiều khoản chi cùng lúc
   */
  async getMultipleItemsTrend(itemNames, months = 12, userId) {
    return await MonthlyExpense.getMultipleItemsTrend(itemNames, months, userId);
  }

  /**
   * Lấy danh sách tên khoản chi tiêu unique của user
   */
  async getAllUniqueItemNames(userId) {
    return await MonthlyExpense.getAllUniqueItemNames(userId);
  }

  /**
   * Xóa toàn bộ chi tiêu của một tháng
   */
  async deleteMonth(month, userId) {
    const expense = await MonthlyExpense.findByMonth(month, userId);
    if (!expense) return false;
    
    await MonthlyExpense.delete(expense.id);
    return true;
  }

  /**
   * Lấy danh sách tracked items của user
   */
  async getTrackedItems(userId) {
    const items = await UserSettings.getSetting(userId, TRACKED_ITEMS_KEY);
    return items || [];
  }

  /**
   * Lưu danh sách tracked items của user
   */
  async saveTrackedItems(userId, items) {
    return await UserSettings.saveSetting(userId, TRACKED_ITEMS_KEY, items);
  }
}

module.exports = new ExpenseService();
