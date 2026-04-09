/**
 * Holding Model
 * Quản lý tình trạng nắm giữ hiện tại
 */
const BaseModel = require('./BaseModel');

class Holding extends BaseModel {
  constructor() {
    super('holdings');
  }

  async findByCategory(categoryId) {
    const row = await this.qb().where({ category_id: categoryId }).first();
    return row || null;
  }

  async updateOrCreate(categoryId, data) {
    const existing = await this.findByCategory(categoryId);
    if (existing) {
      return this.update(existing.id, data);
    }
    return this.create({ category_id: categoryId, ...data });
  }

  async getAllWithCategories(userId) {
    return this.db('holdings as h')
      .select(
        'h.*',
        'c.name as category_name',
        'c.color as category_color',
        'c.description as category_description',
        this.db.raw('(COALESCE(h.current_price, 0) * h.quantity) as current_value'),
        this.db.raw('(((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) as pnl'),
        this.db.raw(`CASE 
          WHEN h.total_invested > 0 
          THEN ((((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) / h.total_invested * 100)
          ELSE 0 
        END as pnl_percentage`)
      )
      .join('categories as c', 'h.category_id', 'c.id')
      .where('c.user_id', userId)
      .orderBy(this.db.raw('(COALESCE(h.current_price, 0) * h.quantity)'), 'desc');
  }

  async getTotalPortfolio(userId) {
    const row = await this.db('holdings as h')
      .select(
        this.db.raw('SUM(h.total_invested) as total_invested'),
        this.db.raw('SUM(COALESCE(h.total_sold, 0)) as total_sold'),
        this.db.raw('SUM(COALESCE(h.current_price, 0) * h.quantity) as total_value'),
        this.db.raw('SUM(((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) as total_pnl'),
        this.db.raw(`CASE 
          WHEN SUM(h.total_invested) > 0 
          THEN ((SUM(((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested)) / SUM(h.total_invested) * 100)
          ELSE 0 
        END as total_pnl_percentage`)
      )
      .join('categories as c', 'h.category_id', 'c.id')
      .where('c.user_id', userId)
      .first();
    return row;
  }

  async recalculateFromTransactions(categoryId) {
    const results = await this.db('transactions')
      .select('type')
      .sum('quantity as total_quantity')
      .sum('amount as total_amount')
      .where({ category_id: categoryId })
      .groupBy('type');

    let buyQuantity = 0, buyAmount = 0;
    let sellQuantity = 0, sellAmount = 0;

    results.forEach(row => {
      if (row.type === 'buy') {
        buyQuantity = parseFloat(row.total_quantity) || 0;
        buyAmount = parseFloat(row.total_amount) || 0;
      } else if (row.type === 'sell') {
        sellQuantity = parseFloat(row.total_quantity) || 0;
        sellAmount = parseFloat(row.total_amount) || 0;
      }
    });

    const quantity = buyQuantity - sellQuantity;
    const totalInvested = buyAmount;
    const totalSold = sellAmount;
    const averagePrice = quantity > 0 ? (buyAmount - sellAmount) / quantity : 0;

    const existing = await this.findByCategory(categoryId);
    const currentPrice = existing ? (existing.current_price || averagePrice) : averagePrice;

    return this.updateOrCreate(categoryId, {
      quantity,
      average_price: averagePrice,
      current_price: currentPrice,
      total_invested: totalInvested,
      total_sold: totalSold
    });
  }

  async updateCurrentPrice(categoryId, currentPrice) {
    const holding = await this.findByCategory(categoryId);
    if (!holding) {
      throw new Error('Holding not found for this category');
    }
    return this.update(holding.id, { current_price: currentPrice });
  }
}

module.exports = new Holding();
