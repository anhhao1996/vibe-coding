/**
 * Holding Model
 * Single Responsibility: Quản lý tình trạng nắm giữ hiện tại
 */
const BaseModel = require('./BaseModel');

class Holding extends BaseModel {
  constructor() {
    super('holdings');
  }

  async findByCategory(categoryId) {
    const sql = `SELECT * FROM ${this.tableName} WHERE category_id = ?`;
    const results = await this.db.query(sql, [categoryId]);
    return results[0] || null;
  }

  async updateOrCreate(categoryId, data) {
    const existing = await this.findByCategory(categoryId);
    
    if (existing) {
      return await this.update(existing.id, data);
    } else {
      return await this.create({ category_id: categoryId, ...data });
    }
  }

  async getAllWithCategories(userId) {
    const sql = `
      SELECT 
        h.*,
        c.name as category_name,
        c.color as category_color,
        c.description as category_description,
        (h.current_value - h.total_invested) as pnl,
        CASE 
          WHEN h.total_invested > 0 
          THEN ((h.current_value - h.total_invested) / h.total_invested * 100)
          ELSE 0 
        END as pnl_percentage
      FROM ${this.tableName} h
      JOIN categories c ON h.category_id = c.id
      WHERE c.user_id = ?
      ORDER BY h.current_value DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async getTotalPortfolio(userId) {
    const sql = `
      SELECT 
        SUM(h.total_invested) as total_invested,
        SUM(h.current_value) as total_value,
        SUM(h.current_value - h.total_invested) as total_pnl,
        CASE 
          WHEN SUM(h.total_invested) > 0 
          THEN ((SUM(h.current_value) - SUM(h.total_invested)) / SUM(h.total_invested) * 100)
          ELSE 0 
        END as total_pnl_percentage
      FROM ${this.tableName} h
      JOIN categories c ON h.category_id = c.id
      WHERE c.user_id = ?
    `;
    const results = await this.db.query(sql, [userId]);
    return results[0];
  }

  async recalculateFromTransactions(categoryId) {
    const sql = `
      SELECT 
        type,
        SUM(quantity) as total_quantity,
        SUM(amount) as total_amount
      FROM transactions
      WHERE category_id = ?
      GROUP BY type
    `;
    const results = await this.db.query(sql, [categoryId]);
    
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
    const totalInvested = buyAmount - sellAmount;
    const averagePrice = quantity > 0 ? totalInvested / quantity : 0;

    return await this.updateOrCreate(categoryId, {
      quantity: quantity,
      average_price: averagePrice,
      total_invested: totalInvested,
      current_value: totalInvested // Sẽ được cập nhật từ external source
    });
  }
}

module.exports = new Holding();
