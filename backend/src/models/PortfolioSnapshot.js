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
        d.snapshot_date,
        COALESCE(inv.total_value, 0) as total_value,
        COALESCE(inv.total_invested, 0) as total_invested,
        COALESCE(inv.total_sold, 0) as total_sold,
        COALESCE(inv.total_pnl, 0) as total_pnl,
        COALESCE(inv.avg_pnl_percentage, 0) as avg_pnl_percentage,
        COALESCE(ss.total_balance, 0) as savings_balance,
        COALESCE(ss.total_deposited, 0) as savings_deposited
      FROM (
        SELECT DISTINCT snapshot_date FROM (
          SELECT ps.snapshot_date FROM ${this.tableName} ps
          INNER JOIN categories c ON ps.category_id = c.id
          WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND c.user_id = ?
          UNION
          SELECT snapshot_date FROM savings_snapshots
          WHERE user_id = ? AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ) u
      ) d
      LEFT JOIN (
        SELECT 
          ps.snapshot_date,
          SUM(ps.total_value) as total_value,
          SUM(ps.total_invested) as total_invested,
          SUM(COALESCE(ps.total_sold, 0)) as total_sold,
          SUM(ps.pnl) as total_pnl,
          AVG(ps.pnl_percentage) as avg_pnl_percentage
        FROM ${this.tableName} ps
        INNER JOIN categories c ON ps.category_id = c.id
        WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND c.user_id = ?
        GROUP BY ps.snapshot_date
      ) inv ON inv.snapshot_date = d.snapshot_date
      LEFT JOIN savings_snapshots ss ON ss.user_id = ? AND ss.snapshot_date = d.snapshot_date
      ORDER BY d.snapshot_date ASC
    `;
    return await this.db.query(sql, [days, userId, userId, days, days, userId, userId]);
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
        d.snapshot_date,
        COALESCE(inv.pnl_sum, 0) as investment_pnl,
        COALESCE(ss.total_interest, 0) as savings_interest,
        COALESCE(inv.pnl_sum, 0) + COALESCE(ss.total_interest, 0) as daily_pnl,
        (
          SELECT COALESCE(SUM(ps2.pnl), 0)
          FROM ${this.tableName} ps2
          INNER JOIN categories c2 ON ps2.category_id = c2.id
          WHERE ps2.snapshot_date = d.snapshot_date AND c2.user_id = ?
        ) as cumulative_pnl
      FROM (
        SELECT DISTINCT snapshot_date FROM (
          SELECT ps.snapshot_date FROM ${this.tableName} ps
          INNER JOIN categories c ON ps.category_id = c.id
          WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND c.user_id = ?
          UNION
          SELECT snapshot_date FROM savings_snapshots
          WHERE user_id = ? AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        ) u
      ) d
      LEFT JOIN (
        SELECT 
          ps.snapshot_date,
          SUM(ps.pnl) as pnl_sum
        FROM ${this.tableName} ps
        INNER JOIN categories c ON ps.category_id = c.id
        WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND c.user_id = ?
        GROUP BY ps.snapshot_date
      ) inv ON inv.snapshot_date = d.snapshot_date
      LEFT JOIN savings_snapshots ss ON ss.user_id = ? AND ss.snapshot_date = d.snapshot_date
      ORDER BY d.snapshot_date ASC
    `;
    return await this.db.query(sql, [userId, userId, userId, userId, userId]);
  }
}

module.exports = new PortfolioSnapshot();
