/**
 * Transaction Service
 * Single Responsibility: Business logic cho transactions
 * Dependency Inversion: Phụ thuộc vào abstractions
 */
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Holding = require('../models/Holding');

class TransactionService {
  async getAllTransactions(limit = 100, userId) {
    return await Transaction.findAllWithCategory(limit, userId);
  }

  async getTransactionsByCategory(categoryId, limit = 50, userId) {
    // Verify category belongs to user
    const belongsToUser = await Category.belongsToUser(categoryId, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }
    
    return await Transaction.findByCategory(categoryId, limit);
  }

  async getRecentTransactions(days = 7, userId) {
    return await Transaction.getRecentTransactions(days, userId);
  }

  async createTransaction(data, userId) {
    // Validate category belongs to user
    const belongsToUser = await Category.belongsToUser(data.category_id, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }

    // Validate data
    if (!['buy', 'sell'].includes(data.type)) {
      throw new Error('Transaction type must be "buy" or "sell"');
    }

    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    // Calculate amount if not provided
    const amount = data.amount || (data.quantity * data.price);

    // For sell transactions, check if we have enough holdings
    if (data.type === 'sell') {
      const holding = await Holding.findByCategory(data.category_id);
      if (!holding || holding.quantity < data.quantity) {
        throw new Error('Insufficient holdings for this sell transaction');
      }
    }

    // Create transaction
    const transaction = await Transaction.create({
      category_id: data.category_id,
      type: data.type,
      amount: amount,
      price: data.price,
      quantity: data.quantity,
      transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
      notes: data.notes || null
    });

    // Recalculate holdings
    await Holding.recalculateFromTransactions(data.category_id);

    return transaction;
  }

  async updateTransaction(id, data, userId) {
    const existing = await Transaction.findById(id);
    if (!existing) {
      throw new Error('Transaction not found');
    }

    // Verify original category belongs to user
    const originalBelongsToUser = await Category.belongsToUser(existing.category_id, userId);
    if (!originalBelongsToUser) {
      throw new Error('Transaction not found');
    }

    const categoryId = data.category_id || existing.category_id;

    // Validate new category if changing
    if (data.category_id && data.category_id !== existing.category_id) {
      const newBelongsToUser = await Category.belongsToUser(data.category_id, userId);
      if (!newBelongsToUser) {
        throw new Error('Category not found');
      }
    }

    // Get the new values (use provided or keep existing)
    const newQuantity = data.quantity !== undefined ? parseFloat(data.quantity) : parseFloat(existing.quantity);
    const newPrice = data.price !== undefined ? parseFloat(data.price) : parseFloat(existing.price);
    const newType = data.type || existing.type;

    // For sell transactions, check if we have enough holdings
    if (newType === 'sell') {
      const holding = await Holding.findByCategory(categoryId);
      // Calculate current available (excluding this transaction if it was a sell)
      let available = holding ? parseFloat(holding.quantity) : 0;
      if (existing.type === 'sell') {
        available += parseFloat(existing.quantity); // Add back the original sell quantity
      }
      if (existing.type === 'buy') {
        available -= parseFloat(existing.quantity); // Remove the original buy if changing from buy to sell
      }
      if (available < newQuantity) {
        throw new Error('Insufficient holdings for this sell transaction');
      }
    }

    // Recalculate amount based on new price and quantity
    const newAmount = newQuantity * newPrice;

    const updatedTransaction = await Transaction.update(id, {
      category_id: categoryId,
      type: newType,
      amount: newAmount,
      price: newPrice,
      quantity: newQuantity,
      transaction_date: data.transaction_date || existing.transaction_date,
      notes: data.notes !== undefined ? data.notes : existing.notes
    });

    // Recalculate holdings for affected categories
    await Holding.recalculateFromTransactions(categoryId);
    if (existing.category_id !== categoryId) {
      await Holding.recalculateFromTransactions(existing.category_id);
    }

    return updatedTransaction;
  }

  async deleteTransaction(id, userId) {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify category belongs to user
    const belongsToUser = await Category.belongsToUser(transaction.category_id, userId);
    if (!belongsToUser) {
      throw new Error('Transaction not found');
    }

    const categoryId = transaction.category_id;
    await Transaction.delete(id);

    // Recalculate holdings
    await Holding.recalculateFromTransactions(categoryId);

    return true;
  }

  async getTransactionsByDateRange(startDate, endDate, userId) {
    return await Transaction.getTransactionsByDateRange(startDate, endDate, userId);
  }
}

module.exports = new TransactionService();
