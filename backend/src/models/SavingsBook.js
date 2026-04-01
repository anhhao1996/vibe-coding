/**
 * Savings Book Model
 * Quản lý sổ tiết kiệm
 */
const BaseModel = require('./BaseModel');

class SavingsBook extends BaseModel {
  constructor() {
    super('savings_books');
  }

  async findAllByUser(userId) {
    const sql = `
      SELECT 
        sb.*,
        COALESCE(SUM(CASE WHEN st.type = 'deposit' THEN st.amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN st.type = 'withdrawal' THEN st.amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN st.type = 'interest' THEN st.amount ELSE 0 END), 0) as total_interest,
        COALESCE(
          SUM(CASE WHEN st.type IN ('deposit', 'interest') THEN st.amount ELSE 0 END) -
          SUM(CASE WHEN st.type = 'withdrawal' THEN st.amount ELSE 0 END),
          0
        ) as balance,
        COUNT(st.id) as transaction_count
      FROM ${this.tableName} sb
      LEFT JOIN savings_transactions st ON st.savings_book_id = sb.id
      WHERE sb.user_id = ?
      GROUP BY sb.id
      ORDER BY sb.created_at DESC
    `;
    return await this.db.query(sql, [userId]);
  }

  async findByIdWithTransactions(id) {
    const book = await this.findById(id);
    if (!book) return null;

    const txSql = `
      SELECT * FROM savings_transactions 
      WHERE savings_book_id = ? 
      ORDER BY transaction_date DESC, created_at DESC
    `;
    const transactions = await this.db.query(txSql, [id]);

    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'deposit') acc.total_deposited += parseFloat(tx.amount);
      else if (tx.type === 'withdrawal') acc.total_withdrawn += parseFloat(tx.amount);
      else if (tx.type === 'interest') acc.total_interest += parseFloat(tx.amount);
      return acc;
    }, { total_deposited: 0, total_withdrawn: 0, total_interest: 0 });

    return {
      ...book,
      ...totals,
      balance: totals.total_deposited + totals.total_interest - totals.total_withdrawn,
      transactions
    };
  }

  async belongsToUser(id, userId) {
    const sql = `SELECT id FROM ${this.tableName} WHERE id = ? AND user_id = ?`;
    const results = await this.db.query(sql, [id, userId]);
    return results.length > 0;
  }

  /** Tổng số dư tiết kiệm (tất cả sổ) của user */
  async getTotalBalanceForUser(userId) {
    const books = await this.findAllByUser(userId);
    return books.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
  }
}

module.exports = new SavingsBook();
