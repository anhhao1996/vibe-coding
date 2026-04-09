/**
 * Transaction Model
 * Quản lý các giao dịch mua/bán
 */
const BaseModel = require('./BaseModel');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  async findByCategory(categoryId, limit = 50) {
    return this.db('transactions as t')
      .select('t.*', 'c.name as category_name', 'c.color as category_color')
      .join('categories as c', 't.category_id', 'c.id')
      .where('t.category_id', categoryId)
      .orderBy([
        { column: 't.transaction_date', order: 'desc' },
        { column: 't.created_at', order: 'desc' }
      ])
      .limit(limit);
  }

  async findAllWithCategory(limit = 100, userId) {
    return this.db('transactions as t')
      .select('t.*', 'c.name as category_name', 'c.color as category_color')
      .join('categories as c', 't.category_id', 'c.id')
      .where('c.user_id', userId)
      .orderBy([
        { column: 't.transaction_date', order: 'desc' },
        { column: 't.created_at', order: 'desc' }
      ])
      .limit(limit);
  }

  async getRecentTransactions(days = 7, userId) {
    return this.db('transactions as t')
      .select('t.*', 'c.name as category_name', 'c.color as category_color')
      .join('categories as c', 't.category_id', 'c.id')
      .where('c.user_id', userId)
      .andWhere('t.transaction_date', '>=', this.db.raw('DATE_SUB(CURDATE(), INTERVAL ? DAY)', [days]))
      .orderBy([
        { column: 't.transaction_date', order: 'desc' },
        { column: 't.created_at', order: 'desc' }
      ]);
  }

  async getTotalsByCategory(categoryId) {
    return this.qb()
      .select('type')
      .sum('amount as total_amount')
      .sum('quantity as total_quantity')
      .count('* as count')
      .where({ category_id: categoryId })
      .groupBy('type');
  }

  async getTransactionsByDateRange(startDate, endDate, userId) {
    return this.db('transactions as t')
      .select('t.*', 'c.name as category_name', 'c.color as category_color')
      .join('categories as c', 't.category_id', 'c.id')
      .where('c.user_id', userId)
      .andWhereBetween('t.transaction_date', [startDate, endDate])
      .orderBy('t.transaction_date', 'desc');
  }
}

module.exports = new Transaction();
