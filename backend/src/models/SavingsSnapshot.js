/**
 * Savings Snapshot - Số dư + tổng lãi đã nhận tại ngày Lưu Snapshot
 */
const BaseModel = require('./BaseModel');

class SavingsSnapshot extends BaseModel {
  constructor() {
    super('savings_snapshots');
  }

  async upsert(userId, snapshotDate, { totalBalance, totalInterest, totalDeposited }) {
    const existing = await this.qb()
      .select('id')
      .where({ user_id: userId, snapshot_date: snapshotDate })
      .first();

    const balance = parseFloat(totalBalance) || 0;
    const interest = parseFloat(totalInterest) || 0;
    const deposited = parseFloat(totalDeposited) || 0;

    if (existing) {
      return this.update(existing.id, {
        total_balance: balance,
        total_interest: interest,
        total_deposited: deposited
      });
    }

    return this.create({
      user_id: userId,
      snapshot_date: snapshotDate,
      total_balance: balance,
      total_interest: interest,
      total_deposited: deposited
    });
  }
}

module.exports = new SavingsSnapshot();
