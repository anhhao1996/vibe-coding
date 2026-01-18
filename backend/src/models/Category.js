/**
 * Category Model
 * Liskov Substitution: Có thể thay thế BaseModel mà không ảnh hưởng logic
 * Single Responsibility: Chỉ quản lý danh mục đầu tư
 */
const BaseModel = require('./BaseModel');

class Category extends BaseModel {
  constructor() {
    super('categories');
  }

  async findByName(name, userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name = ? AND user_id = ?`;
    const results = await this.db.query(sql, [name, userId]);
    return results[0] || null;
  }

  async findAllByUser(userId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    return await this.db.query(sql, [userId]);
  }

  async findWithHoldings(userId) {
    const sql = `
      SELECT 
        c.*,
        COALESCE(h.quantity, 0) as quantity,
        COALESCE(h.average_price, 0) as average_price,
        COALESCE(h.total_invested, 0) as total_invested,
        COALESCE(h.current_value, 0) as current_value
      FROM categories c
      LEFT JOIN holdings h ON c.id = h.category_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async getCategoryWithDetails(categoryId, userId) {
    const sql = `
      SELECT 
        c.*,
        COALESCE(h.quantity, 0) as quantity,
        COALESCE(h.average_price, 0) as average_price,
        COALESCE(h.total_invested, 0) as total_invested,
        COALESCE(h.current_value, 0) as current_value,
        (SELECT COUNT(*) FROM transactions WHERE category_id = c.id) as transaction_count
      FROM categories c
      LEFT JOIN holdings h ON c.id = h.category_id
      WHERE c.id = ? AND c.user_id = ?
    `;
    const results = await this.db.query(sql, [categoryId, userId]);
    return results[0] || null;
  }

  async belongsToUser(categoryId, userId) {
    const sql = `SELECT id FROM ${this.tableName} WHERE id = ? AND user_id = ?`;
    const results = await this.db.query(sql, [categoryId, userId]);
    return results.length > 0;
  }
}

module.exports = new Category();
