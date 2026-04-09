/**
 * Portfolio Snapshot Model
 * Lưu trữ lịch sử giá trị portfolio
 */
const BaseModel = require('./BaseModel');

class PortfolioSnapshot extends BaseModel {
  constructor() {
    super('portfolio_snapshots');
  }

  async findByDateRange(startDate, endDate) {
    return this.db('portfolio_snapshots as ps')
      .select('ps.*', 'c.name as category_name', 'c.color as category_color')
      .join('categories as c', 'ps.category_id', 'c.id')
      .whereBetween('ps.snapshot_date', [startDate, endDate])
      .orderBy('ps.snapshot_date', 'asc');
  }

  async getLastNDays(days = 7, userId) {
    return this.db('portfolio_snapshots as ps')
      .select('ps.snapshot_date')
      .sum('ps.total_value as total_value')
      .sum('ps.total_invested as total_invested')
      .sum('ps.pnl as pnl')
      .join('categories as c', 'ps.category_id', 'c.id')
      .where('c.user_id', userId)
      .andWhere('ps.snapshot_date', '>=', this.db.raw('DATE_SUB(CURDATE(), INTERVAL ? DAY)', [days]))
      .groupBy('ps.snapshot_date')
      .orderBy('ps.snapshot_date', 'asc');
  }

  // UNION + derived tables + multiple JOINs — kept as db.raw() with parameterized bindings
  async getPortfolioHistory(days = 30, userId) {
    const result = await this.db.raw(`
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
          SELECT ps.snapshot_date FROM portfolio_snapshots ps
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
        FROM portfolio_snapshots ps
        INNER JOIN categories c ON ps.category_id = c.id
        WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND c.user_id = ?
        GROUP BY ps.snapshot_date
      ) inv ON inv.snapshot_date = d.snapshot_date
      LEFT JOIN savings_snapshots ss ON ss.user_id = ? AND ss.snapshot_date = d.snapshot_date
      ORDER BY d.snapshot_date ASC
    `, [days, userId, userId, days, days, userId, userId]);
    return result[0];
  }

  async getCategoryHistory(categoryId, days = 30) {
    return this.qb()
      .where({ category_id: categoryId })
      .andWhere('snapshot_date', '>=', this.db.raw('DATE_SUB(CURDATE(), INTERVAL ? DAY)', [days]))
      .orderBy('snapshot_date', 'asc');
  }

  async createOrUpdateSnapshot(categoryId, snapshotDate, data) {
    const existing = await this.qb()
      .select('id')
      .where({ category_id: categoryId, snapshot_date: snapshotDate })
      .first();

    if (existing) {
      return this.update(existing.id, data);
    }
    return this.create({
      category_id: categoryId,
      snapshot_date: snapshotDate,
      ...data
    });
  }

  // Correlated subquery + UNION + derived tables — kept as db.raw() with parameterized bindings
  async getPnlLast7Days(userId) {
    const result = await this.db.raw(`
      SELECT 
        d.snapshot_date,
        COALESCE(inv.pnl_sum, 0) as investment_pnl,
        COALESCE(ss.total_interest, 0) as savings_interest,
        COALESCE(inv.pnl_sum, 0) + COALESCE(ss.total_interest, 0) as daily_pnl,
        (
          SELECT COALESCE(SUM(ps2.pnl), 0)
          FROM portfolio_snapshots ps2
          INNER JOIN categories c2 ON ps2.category_id = c2.id
          WHERE ps2.snapshot_date = d.snapshot_date AND c2.user_id = ?
        ) as cumulative_pnl
      FROM (
        SELECT DISTINCT snapshot_date FROM (
          SELECT ps.snapshot_date FROM portfolio_snapshots ps
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
        FROM portfolio_snapshots ps
        INNER JOIN categories c ON ps.category_id = c.id
        WHERE ps.snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND c.user_id = ?
        GROUP BY ps.snapshot_date
      ) inv ON inv.snapshot_date = d.snapshot_date
      LEFT JOIN savings_snapshots ss ON ss.user_id = ? AND ss.snapshot_date = d.snapshot_date
      ORDER BY d.snapshot_date ASC
    `, [userId, userId, userId, userId, userId]);
    return result[0];
  }
}

module.exports = new PortfolioSnapshot();
