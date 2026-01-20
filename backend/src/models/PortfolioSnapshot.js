/**
 * Portfolio Snapshot Model
 * Single Responsibility: Lưu trữ lịch sử giá trị portfolio
 */
const BaseModel = require('./BaseModel');

class PortfolioSnapshot extends BaseModel {
  constructor() {
    super('portfolio_snapshots');
  }

  async findByDateRange(startDate, endDate) {
    const sql = `
      SELECT 
        ps.*,
        c.name as category_name,
        c.color as category_color
      FROM ${this.tableName} ps
      JOIN categories c ON ps.category_id = c.id
      WHERE ps.snapshot_date BETWEEN ? AND ?
      ORDER BY ps.snapshot_date ASC
    `;
    return await this.db.query(sql, [startDate, endDate]);
  }

  async getLastNDays(days = 7, userId) {
    const sql = `
      SELECT 
        ps.snapshot_date,
        SUM(ps.total_value) as total_value,
        SUM(ps.total_invested) as total_invested,
        SUM(ps.pnl) as pnl
      FROM ${this.tableName} ps
      JOIN categories c ON ps.category_id = c.id
      WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND c.user_id = ?
      GROUP BY ps.snapshot_date
      ORDER BY ps.snapshot_date ASC
    `;
    return await this.db.query(sql, [days, userId]);
  }

  async getPortfolioHistory(days = 30, userId) {
    const sql = `
      SELECT 
        ps.snapshot_date,
        SUM(ps.total_value) as total_value,
        SUM(ps.total_invested) as total_invested,
        SUM(ps.pnl) as total_pnl,
        AVG(ps.pnl_percentage) as avg_pnl_percentage
      FROM ${this.tableName} ps
      JOIN categories c ON ps.category_id = c.id
      WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND c.user_id = ?
      GROUP BY ps.snapshot_date
      ORDER BY ps.snapshot_date ASC
    `;
    return await this.db.query(sql, [days, userId]);
  }

  async getCategoryHistory(categoryId, days = 30) {
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE category_id = ? AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY snapshot_date ASC
    `;
    return await this.db.query(sql, [categoryId, days]);
  }

  async createOrUpdateSnapshot(categoryId, snapshotDate, data) {
    const checkSql = `
      SELECT id FROM ${this.tableName} 
      WHERE category_id = ? AND snapshot_date = ?
    `;
    const existing = await this.db.query(checkSql, [categoryId, snapshotDate]);

    if (existing.length > 0) {
      return await this.update(existing[0].id, data);
    } else {
      return await this.create({
        category_id: categoryId,
        snapshot_date: snapshotDate,
        ...data
      });
    }
  }

  async getPnlLast7Days(userId) {
    const sql = `
      SELECT 
        ps.snapshot_date,
        SUM(ps.pnl) as daily_pnl,
        (
          SELECT SUM(ps2.pnl) 
          FROM ${this.tableName} ps2
          JOIN categories c2 ON ps2.category_id = c2.id
          WHERE ps2.snapshot_date = ps.snapshot_date AND c2.user_id = ?
        ) as cumulative_pnl
      FROM ${this.tableName} ps
      JOIN categories c ON ps.category_id = c.id
      WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND c.user_id = ?
      GROUP BY ps.snapshot_date
      ORDER BY ps.snapshot_date ASC
    `;
    return await this.db.query(sql, [userId, userId]);
  }
}

module.exports = new PortfolioSnapshot();
