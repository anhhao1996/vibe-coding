/**
 * Expense Service
 * Business logic cho quản lý chi tiêu
 */
const MonthlyExpense = require('../models/MonthlyExpense');
const ExpenseItem = require('../models/ExpenseItem');
const UserSettings = require('../models/UserSettings');

const TRACKED_ITEMS_KEY = 'expense_tracked_items';

class ExpenseService {
  async getMonthlyExpense(month, userId) {
    const expense = await MonthlyExpense.findByMonth(month, userId);
    if (!expense) return null;

    const items = await ExpenseItem.findByMonthlyExpense(expense.id);
    return { ...expense, items };
  }

  async getMonthlyExpenseById(id, userId) {
    const expense = await MonthlyExpense.findById(id);
    if (!expense || expense.user_id !== userId) return null;

    return MonthlyExpense.findWithItems(id);
  }

  async createOrUpdateMonth(month, notes = '', userId) {
    let expense = await MonthlyExpense.findByMonth(month, userId);

    if (!expense) {
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

  async addExpenseItem(monthlyExpenseId, data) {
    const item = await ExpenseItem.create({
      monthly_expense_id: monthlyExpenseId,
      name: data.name,
      amount: data.amount || 0,
      notes: data.notes || ''
    });

    await MonthlyExpense.updateTotalAmount(monthlyExpenseId);
    return item;
  }

  async updateExpenseItem(id, data) {
    const item = await ExpenseItem.findById(id);
    if (!item) return null;

    await ExpenseItem.update(id, {
      name: data.name,
      amount: data.amount,
      notes: data.notes
    });

    await MonthlyExpense.updateTotalAmount(item.monthly_expense_id);
    return ExpenseItem.findById(id);
  }

  async deleteExpenseItem(id) {
    const item = await ExpenseItem.findById(id);
    if (!item) return false;

    const monthlyExpenseId = item.monthly_expense_id;
    await ExpenseItem.delete(id);
    await MonthlyExpense.updateTotalAmount(monthlyExpenseId);

    return true;
  }

  async copyFromPreviousMonth(sourceMonth, targetMonth, userId) {
    const sourceExpense = await this.getMonthlyExpense(sourceMonth, userId);
    if (!sourceExpense) {
      throw new Error(`Không tìm thấy dữ liệu tháng ${sourceMonth}`);
    }

    let targetExpense = await MonthlyExpense.findByMonth(targetMonth, userId);
    if (!targetExpense) {
      targetExpense = await MonthlyExpense.create({
        user_id: userId,
        month: targetMonth,
        total_amount: 0,
        notes: `Copy từ tháng ${sourceMonth}`
      });
    }

    await ExpenseItem.copyFromMonth(sourceExpense.id, targetExpense.id);
    await MonthlyExpense.updateTotalAmount(targetExpense.id);

    return this.getMonthlyExpenseById(targetExpense.id, userId);
  }

  async getMonthlyTrend(months = 12, userId) {
    return MonthlyExpense.getMonthlyTrend(months, userId);
  }

  async getMultipleItemsTrend(itemNames, months = 12, userId) {
    return MonthlyExpense.getMultipleItemsTrend(itemNames, months, userId);
  }

  async getAllUniqueItemNames(userId) {
    return MonthlyExpense.getAllUniqueItemNames(userId);
  }

  async deleteMonth(month, userId) {
    const expense = await MonthlyExpense.findByMonth(month, userId);
    if (!expense) return false;

    await MonthlyExpense.delete(expense.id);
    return true;
  }

  async getTrackedItems(userId) {
    const items = await UserSettings.getSetting(userId, TRACKED_ITEMS_KEY);
    return items || [];
  }

  async saveTrackedItems(userId, items) {
    return UserSettings.saveSetting(userId, TRACKED_ITEMS_KEY, items);
  }
}

module.exports = new ExpenseService();
