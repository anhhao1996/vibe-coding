/**
 * Base Model - Abstract class for all models
 * Open/Closed Principle: Open for extension, closed for modification
 * Dependency Inversion: Depends on database abstraction
 */
const db = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  async findAll(orderBy = 'created_at DESC') {
    // Validate orderBy to prevent SQL injection
    const ALLOWED_COLUMNS = ['id', 'name', 'created_at', 'updated_at', 'transaction_date', 'snapshot_date', 'month', 'amount', 'price', 'quantity'];
    const ALLOWED_DIRECTIONS = ['ASC', 'DESC'];
    const parts = orderBy.trim().split(/\s+/);
    const column = parts[0];
    const direction = (parts[1] || 'DESC').toUpperCase();
    if (!ALLOWED_COLUMNS.includes(column) || !ALLOWED_DIRECTIONS.includes(direction)) {
      throw new Error('Invalid orderBy parameter');
    }
    const sql = `SELECT * FROM ${this.tableName} ORDER BY ${column} ${direction}`;
    return await this.db.query(sql);
  }

  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const results = await this.db.query(sql, [id]);
    return results[0] || null;
  }

  async create(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    const result = await this.db.query(sql, values);
    
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    await this.db.query(sql, values);
    
    return this.findById(id);
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  async count() {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const results = await this.db.query(sql);
    return results[0].count;
  }
}

module.exports = BaseModel;
