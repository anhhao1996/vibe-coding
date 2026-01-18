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
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE monthly_expense_id = ? 
      ORDER BY created_at ASC
    `;
    return await this.db.query(sql, [monthlyExpenseId]);
  }

  async copyFromMonth(sourceMonthlyExpenseId, targetMonthlyExpenseId) {
    // Lấy tất cả items từ tháng nguồn
    const sourceItems = await this.findByMonthlyExpense(sourceMonthlyExpenseId);
    
    // Copy sang tháng đích
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
