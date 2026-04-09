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
    return this.qb()
      .where({ savings_book_id: savingsBookId })
      .orderBy([
        { column: 'transaction_date', order: 'desc' },
        { column: 'created_at', order: 'desc' }
      ]);
  }
}

module.exports = new SavingsTransaction();
