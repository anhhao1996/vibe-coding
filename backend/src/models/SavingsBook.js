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
    return this.db('savings_books as sb')
      .select(
        'sb.*',
        this.db.raw("COALESCE(SUM(CASE WHEN st.type = 'deposit' THEN st.amount ELSE 0 END), 0) as total_deposited"),
        this.db.raw("COALESCE(SUM(CASE WHEN st.type = 'withdrawal' THEN st.amount ELSE 0 END), 0) as total_withdrawn"),
        this.db.raw("COALESCE(SUM(CASE WHEN st.type = 'interest' THEN st.amount ELSE 0 END), 0) as total_interest"),
        this.db.raw(`COALESCE(
          SUM(CASE WHEN st.type IN ('deposit', 'interest') THEN st.amount ELSE 0 END) -
          SUM(CASE WHEN st.type = 'withdrawal' THEN st.amount ELSE 0 END),
          0
        ) as balance`),
        this.db.raw('COUNT(st.id) as transaction_count')
      )
      .leftJoin('savings_transactions as st', 'st.savings_book_id', 'sb.id')
      .where('sb.user_id', userId)
      .groupBy('sb.id')
      .orderBy('sb.created_at', 'desc');
  }

  async findByIdWithTransactions(id) {
    const book = await this.findById(id);
    if (!book) return null;

    const transactions = await this.db('savings_transactions')
      .where({ savings_book_id: id })
      .orderBy([
        { column: 'transaction_date', order: 'desc' },
        { column: 'created_at', order: 'desc' }
      ]);

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
    const row = await this.qb()
      .select('id')
      .where({ id, user_id: userId })
      .first();
    return !!row;
  }

  async getTotalBalanceForUser(userId) {
    const books = await this.findAllByUser(userId);
    return books.reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);
  }
}

module.exports = new SavingsBook();
