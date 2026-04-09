/**
 * Expense Item Model
 * Chi tiết từng khoản chi tiêu
 */
const BaseModel = require('./BaseModel');

class ExpenseItem extends BaseModel {
  constructor() {
    super('expense_items');
  }

  async findByMonthlyExpense(monthlyExpenseId) {
    return this.qb()
      .where({ monthly_expense_id: monthlyExpenseId })
      .orderBy('created_at', 'asc');
  }

  async copyFromMonth(sourceMonthlyExpenseId, targetMonthlyExpenseId) {
    const sourceItems = await this.findByMonthlyExpense(sourceMonthlyExpenseId);

    const copiedItems = [];
    for (const item of sourceItems) {
      const newItem = await this.create({
        monthly_expense_id: targetMonthlyExpenseId,
        name: item.name,
        amount: item.amount,
        notes: item.notes
      });
      copiedItems.push(newItem);
    }

    return copiedItems;
  }
}

module.exports = new ExpenseItem();
