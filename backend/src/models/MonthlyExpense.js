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
    const sql = `SELECT * FROM ${this.tableName} WHERE month = ? AND user_id = ?`;
    const results = await this.db.query(sql, [month, userId]);
    return results[0] || null;
  }

  async findAllWithTotal(userId) {
    const sql = `
      SELECT 
        me.*,
        (SELECT COUNT(*) FROM expense_items WHERE monthly_expense_id = me.id) as item_count
      FROM ${this.tableName} me
      WHERE me.user_id = ?
      ORDER BY me.month DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async findWithItems(id) {
    const expense = await this.findById(id);
    if (!expense) return null;

    const itemsSql = `
      SELECT * FROM expense_items 
      WHERE monthly_expense_id = ? 
      ORDER BY created_at ASC
    `;
    const items = await this.db.query(itemsSql, [id]);
    
    return { ...expense, items };
  }

  async findByMonthWithItems(month) {
    const expense = await this.findByMonth(month);
    if (!expense) return null;

    const itemsSql = `
      SELECT * FROM expense_items 
      WHERE monthly_expense_id = ? 
      ORDER BY created_at ASC
    `;
    const items = await this.db.query(itemsSql, [expense.id]);
    
    return { ...expense, items };
  }

  async getMonthlyTrend(months = 12, userId) {
    const sql = `
      SELECT 
        me.month,
        me.total_amount
      FROM ${this.tableName} me
      WHERE me.user_id = ?
      ORDER BY me.month DESC
      LIMIT ?
    `;
    const results = await this.db.query(sql, [userId, months]);
    return results.reverse(); // Oldest first for chart
  }

  async createOrUpdate(month, data) {
    const existing = await this.findByMonth(month);
    if (existing) {
      return await this.update(existing.id, data);
    }
    return await this.create({ month, ...data });
  }

  async updateTotalAmount(id) {
    const sql = `
      UPDATE ${this.tableName} 
      SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) FROM expense_items WHERE monthly_expense_id = ?
      )
      WHERE id = ?
    `;
    await this.db.query(sql, [id, id]);
  }

  async getItemTrendByName(itemName, months = 12) {
    const sql = `
      SELECT 
        me.month,
        COALESCE(ei.amount, 0) as amount
      FROM ${this.tableName} me
      LEFT JOIN expense_items ei ON ei.monthly_expense_id = me.id AND ei.name = ?
      ORDER BY me.month DESC
      LIMIT ?
    `;
    const results = await this.db.query(sql, [itemName, months]);
    return results.reverse(); // Oldest first for chart
  }

  async getMultipleItemsTrend(itemNames, months = 12, userId) {
    // Get all months first
    const monthsSql = `
      SELECT month FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY month DESC
      LIMIT ?
    `;
    const monthsResult = await this.db.query(monthsSql, [userId, months]);
    const monthsList = monthsResult.reverse();

    // Get data for each item name
    const trends = {};
    for (const name of itemNames) {
      trends[name] = [];
      for (const { month } of monthsList) {
        const itemSql = `
          SELECT COALESCE(ei.amount, 0) as amount
          FROM ${this.tableName} me
          LEFT JOIN expense_items ei ON ei.monthly_expense_id = me.id AND ei.name = ?
          WHERE me.month = ? AND me.user_id = ?
        `;
        const result = await this.db.query(itemSql, [name, month, userId]);
        trends[name].push({
          month,
          amount: result[0]?.amount || 0
        });
      }
    }

    return trends;
  }

  /**
   * Lấy danh sách tên khoản chi tiêu unique của user
   */
  async getAllUniqueItemNames(userId) {
    const sql = `
      SELECT DISTINCT ei.name
      FROM expense_items ei
      INNER JOIN ${this.tableName} me ON ei.monthly_expense_id = me.id
      WHERE me.user_id = ?
      ORDER BY ei.name ASC
    `;
    const results = await this.db.query(sql, [userId]);
    return results.map(r => r.name);
  }
}

module.exports = new MonthlyExpense();
