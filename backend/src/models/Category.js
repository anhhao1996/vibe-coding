/**
 * Category Model
 * Quản lý danh mục đầu tư
 */
const BaseModel = require('./BaseModel');

class Category extends BaseModel {
  constructor() {
    super('categories');
  }

  async findByName(name, userId) {
    const row = await this.qb()
      .where({ name, user_id: userId })
      .first();
    return row || null;
  }

  async findAllByUser(userId) {
    return this.qb()
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
  }

  async findWithHoldings(userId) {
    return this.db('categories as c')
      .select(
        'c.*',
        this.db.raw('COALESCE(h.quantity, 0) as quantity'),
        this.db.raw('COALESCE(h.average_price, 0) as average_price'),
        this.db.raw('COALESCE(h.current_price, 0) as current_price'),
        this.db.raw('COALESCE(h.total_invested, 0) as total_invested'),
        this.db.raw('COALESCE(h.total_sold, 0) as total_sold'),
        this.db.raw('(COALESCE(h.current_price, 0) * COALESCE(h.quantity, 0)) as current_value')
      )
      .leftJoin('holdings as h', 'c.id', 'h.category_id')
      .where('c.user_id', userId)
      .orderBy('c.created_at', 'desc');
  }

  async getCategoryWithDetails(categoryId, userId) {
    const row = await this.db('categories as c')
      .select(
        'c.*',
        this.db.raw('COALESCE(h.quantity, 0) as quantity'),
        this.db.raw('COALESCE(h.average_price, 0) as average_price'),
        this.db.raw('COALESCE(h.current_price, 0) as current_price'),
        this.db.raw('COALESCE(h.total_invested, 0) as total_invested'),
        this.db.raw('COALESCE(h.total_sold, 0) as total_sold'),
        this.db.raw('(COALESCE(h.current_price, 0) * COALESCE(h.quantity, 0)) as current_value'),
        this.db.raw('(SELECT COUNT(*) FROM transactions WHERE category_id = c.id) as transaction_count')
      )
      .leftJoin('holdings as h', 'c.id', 'h.category_id')
      .where({ 'c.id': categoryId, 'c.user_id': userId })
      .first();
    return row || null;
  }

  async belongsToUser(categoryId, userId) {
    const row = await this.qb()
      .select('id')
      .where({ id: categoryId, user_id: userId })
      .first();
    return !!row;
  }
}

module.exports = new Category();
