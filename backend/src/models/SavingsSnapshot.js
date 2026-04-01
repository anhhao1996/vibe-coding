/**
 * Savings Snapshot - Số dư + tổng lãi đã nhận tại ngày Lưu Snapshot
 */
const BaseModel = require('./BaseModel');

class SavingsSnapshot extends BaseModel {
  constructor() {
    super('savings_snapshots');
  }

  async upsert(userId, snapshotDate, { totalBalance, totalInterest }) {
    const checkSql = `SELECT id FROM ${this.tableName} WHERE user_id = ? AND snapshot_date = ?`;
    const existing = await this.db.query(checkSql, [userId, snapshotDate]);
    const balance = parseFloat(totalBalance) || 0;
    const interest = parseFloat(totalInterest) || 0;

    if (existing.length > 0) {
      return await this.update(existing[0].id, {
        total_balance: balance,
        total_interest: interest
      });
    }

    return await this.create({
      user_id: userId,
      snapshot_date: snapshotDate,
      total_balance: balance,
      total_interest: interest
    });
  }
}

module.exports = new SavingsSnapshot();
