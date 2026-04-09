/**
 * Base Model - Abstract class for all models
 * Uses Knex query builder instead of raw SQL.
 */
const db = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  qb() {
    return this.db(this.tableName);
  }

  async findAll(orderBy = 'created_at', direction = 'DESC') {
    const ALLOWED_COLUMNS = ['id', 'name', 'created_at', 'updated_at', 'transaction_date', 'snapshot_date', 'month', 'amount', 'price', 'quantity'];
    const ALLOWED_DIRECTIONS = ['ASC', 'DESC'];

    const parts = String(orderBy).trim().split(/\s+/);
    const column = parts[0];
    const dir = (parts[1] || direction).toUpperCase();

    if (!ALLOWED_COLUMNS.includes(column) || !ALLOWED_DIRECTIONS.includes(dir)) {
      throw new Error('Invalid orderBy parameter');
    }

    return this.qb().orderBy(column, dir);
  }

  async findById(id) {
    const row = await this.qb().where({ id }).first();
    return row || null;
  }

  async create(data) {
    const [insertId] = await this.qb().insert(data);
    return this.findById(insertId);
  }

  async update(id, data) {
    await this.qb().where({ id }).update(data);
    return this.findById(id);
  }

  async delete(id) {
    const affected = await this.qb().where({ id }).del();
    return affected > 0;
  }

  async count() {
    const result = await this.qb().count('* as count').first();
    return result.count;
  }
}

module.exports = BaseModel;
