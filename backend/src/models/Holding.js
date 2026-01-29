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
        (COALESCE(h.current_price, 0) * h.quantity) as current_value,
        (((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) as pnl,
        CASE 
          WHEN h.total_invested > 0 
          THEN ((((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) / h.total_invested * 100)
          ELSE 0 
        END as pnl_percentage
      FROM ${this.tableName} h
      JOIN categories c ON h.category_id = c.id
      WHERE c.user_id = ?
      ORDER BY (COALESCE(h.current_price, 0) * h.quantity) DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async getTotalPortfolio(userId) {
    const sql = `
      SELECT 
        SUM(h.total_invested) as total_invested,
        SUM(COALESCE(h.total_sold, 0)) as total_sold,
        SUM(COALESCE(h.current_price, 0) * h.quantity) as total_value,
        SUM(((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested) as total_pnl,
        CASE 
          WHEN SUM(h.total_invested) > 0 
          THEN ((SUM(((COALESCE(h.current_price, 0) * h.quantity) + COALESCE(h.total_sold, 0)) - h.total_invested)) / SUM(h.total_invested) * 100)
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
    // Tổng đầu tư = Tổng giá trị các giao dịch MUA
    const totalInvested = buyAmount;
    // Tổng đã bán = Tổng giá trị các giao dịch BÁN
    const totalSold = sellAmount;
    // Giá vốn trung bình = (Tổng mua - Tổng bán) / Số lượng còn lại
    const averagePrice = quantity > 0 ? (buyAmount - sellAmount) / quantity : 0;

    // Get current holding to preserve current_price (giá hiện tại 1 đơn vị)
    const existing = await this.findByCategory(categoryId);
    // Giữ nguyên current_price, nếu chưa có thì dùng average_price làm mặc định
    const currentPrice = existing ? (existing.current_price || averagePrice) : averagePrice;

    return await this.updateOrCreate(categoryId, {
      quantity: quantity,
      average_price: averagePrice,
      current_price: currentPrice,
      total_invested: totalInvested,
      total_sold: totalSold
    });
  }

  // Cập nhật giá hiện tại (1 đơn vị)
  async updateCurrentPrice(categoryId, currentPrice) {
    const holding = await this.findByCategory(categoryId);
    if (!holding) {
      throw new Error('Holding not found for this category');
    }
    return await this.update(holding.id, { current_price: currentPrice });
  }
}

module.exports = new Holding();
