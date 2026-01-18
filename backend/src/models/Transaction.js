/**
 * Transaction Model
 * Single Responsibility: Quản lý các giao dịch mua/bán
 */
const BaseModel = require('./BaseModel');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  async findByCategory(categoryId, limit = 50) {
    const sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM ${this.tableName} t
      JOIN categories c ON t.category_id = c.id
      WHERE t.category_id = ?
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ?
    `;
    return await this.db.query(sql, [categoryId, limit]);
  }

  async findAllWithCategory(limit = 100, userId) {
    const sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM ${this.tableName} t
      JOIN categories c ON t.category_id = c.id
      WHERE c.user_id = ?
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ?
    `;
    return await this.db.query(sql, [userId, limit]);
  }

  async getRecentTransactions(days = 7, userId) {
    const sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM ${this.tableName} t
      JOIN categories c ON t.category_id = c.id
      WHERE t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND c.user_id = ?
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;
    return await this.db.query(sql, [days, userId]);
  }

  async getTotalsByCategory(categoryId) {
    const sql = `
      SELECT 
        type,
        SUM(amount) as total_amount,
        SUM(quantity) as total_quantity,
        COUNT(*) as count
      FROM ${this.tableName}
      WHERE category_id = ?
      GROUP BY type
    `;
    return await this.db.query(sql, [categoryId]);
  }

  async getTransactionsByDateRange(startDate, endDate, userId) {
    const sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM ${this.tableName} t
      JOIN categories c ON t.category_id = c.id
      WHERE t.transaction_date BETWEEN ? AND ?
        AND c.user_id = ?
      ORDER BY t.transaction_date DESC
    `;
    return await this.db.query(sql, [startDate, endDate, userId]);
  }
}

module.exports = new Transaction();
