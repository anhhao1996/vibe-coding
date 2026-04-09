/**
 * Savings Service
 * Business logic cho quản lý tiết kiệm
 */
const SavingsBook = require('../models/SavingsBook');
const SavingsTransaction = require('../models/SavingsTransaction');

class SavingsService {
  async getAllBooks(userId) {
    return await SavingsBook.findAllByUser(userId);
  }

  async getBookDetail(id, userId) {
    const belongs = await SavingsBook.belongsToUser(id, userId);
    if (!belongs) return null;
    return await SavingsBook.findByIdWithTransactions(id);
  }

  async createBook(data, userId) {
    return await SavingsBook.create({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      color: data.color || '#2196F3'
    });
  }

  async updateBook(id, data, userId) {
    const belongs = await SavingsBook.belongsToUser(id, userId);
    if (!belongs) return null;

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;

    return await SavingsBook.update(id, updateData);
  }

  async deleteBook(id, userId) {
    const belongs = await SavingsBook.belongsToUser(id, userId);
    if (!belongs) return false;
    return await SavingsBook.delete(id);
  }

  async addTransaction(bookId, data, userId) {
    const belongs = await SavingsBook.belongsToUser(bookId, userId);
    if (!belongs) throw new Error('Savings book not found');

    if (data.type === 'withdrawal') {
      const book = await SavingsBook.findByIdWithTransactions(bookId);
      if (parseFloat(data.amount) > book.balance) {
        throw new Error('Số tiền rút vượt quá số dư hiện tại');
      }
    }

    return await SavingsTransaction.create({
      savings_book_id: bookId,
      type: data.type,
      amount: parseFloat(data.amount),
      interest_rate: data.type === 'deposit' && data.interest_rate ? parseFloat(data.interest_rate) : null,
      transaction_date: data.transaction_date,
      notes: data.notes || ''
    });
  }

  async deleteTransaction(id, userId) {
    const tx = await SavingsTransaction.findById(id);
    if (!tx) return false;

    const belongs = await SavingsBook.belongsToUser(tx.savings_book_id, userId);
    if (!belongs) return false;

    return await SavingsTransaction.delete(id);
  }
}

module.exports = new SavingsService();
