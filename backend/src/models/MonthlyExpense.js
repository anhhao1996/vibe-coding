/**
 * Monthly Expense Model
 * Quản lý chi tiêu hàng tháng
 */
const BaseModel = require('./BaseModel');

class MonthlyExpense extends BaseModel {
  constructor() {
    super('monthly_expenses');
  }

  async findByMonth(month, userId) {
    const row = await this.qb()
      .where({ month, user_id: userId })
      .first();
    return row || null;
  }

  async findWithItems(id) {
    const expense = await this.findById(id);
    if (!expense) return null;

    const items = await this.db('expense_items')
      .where({ monthly_expense_id: id })
      .orderBy('created_at', 'asc');

    return { ...expense, items };
  }

  async getMonthlyTrend(months = 12, userId) {
    const results = await this.qb()
      .select('month', 'total_amount')
      .where({ user_id: userId })
      .orderBy('month', 'desc')
      .limit(months);
    return results.reverse();
  }

  async updateTotalAmount(id) {
    await this.db.raw(
      `UPDATE ${this.tableName} 
       SET total_amount = (
         SELECT COALESCE(SUM(amount), 0) FROM expense_items WHERE monthly_expense_id = ?
       )
       WHERE id = ?`,
      [id, id]
    );
  }

  async getMultipleItemsTrend(itemNames, months = 12, userId) {
    const monthsResult = await this.qb()
      .select('month')
      .where({ user_id: userId })
      .orderBy('month', 'desc')
      .limit(months);
    const monthsList = monthsResult.reverse();

    const trends = {};
    for (const name of itemNames) {
      trends[name] = [];
      for (const { month } of monthsList) {
        const db = this.db;
        const result = await db('monthly_expenses as me')
          .select(db.raw('COALESCE(ei.amount, 0) as amount'))
          .leftJoin('expense_items as ei', function () {
            this.on('ei.monthly_expense_id', '=', 'me.id')
                .andOn('ei.name', '=', db.raw('?', [name]));
          })
          .where({ 'me.month': month, 'me.user_id': userId })
          .first();

        trends[name].push({
          month,
          amount: result?.amount || 0
        });
      }
    }

    return trends;
  }

  async getAllUniqueItemNames(userId) {
    const results = await this.db('expense_items as ei')
      .distinct('ei.name')
      .join('monthly_expenses as me', 'ei.monthly_expense_id', 'me.id')
      .where('me.user_id', userId)
      .orderBy('ei.name', 'asc');
    return results.map(r => r.name);
  }
}

module.exports = new MonthlyExpense();
