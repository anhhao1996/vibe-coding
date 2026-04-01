/**
 * Savings Transaction Model
 * Giao dịch tiết kiệm (nạp/rút/lãi)
 */
const BaseModel = require('./BaseModel');

class SavingsTransaction extends BaseModel {
  constructor() {
    super('savings_transactions');
  }

  async findBySavingsBook(savingsBookId) {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE savings_book_id = ? 
      ORDER BY transaction_date DESC, created_at DESC
    `;
    return await this.db.query(sql, [savingsBookId]);
  }
}

module.exports = new SavingsTransaction();
