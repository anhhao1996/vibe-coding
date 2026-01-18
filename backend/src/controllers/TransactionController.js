/**
 * Transaction Controller
 * Single Responsibility: Handle HTTP requests for transactions
 */
const BaseController = require('./BaseController');
const TransactionService = require('../services/TransactionService');

class TransactionController extends BaseController {
  async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const transactions = await TransactionService.getAllTransactions(limit, req.user.id);
      return this.sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getByCategory(req, res) {
    try {
      const categoryId = req.params.categoryId;
      const limit = parseInt(req.query.limit) || 50;
      const transactions = await TransactionService.getTransactionsByCategory(categoryId, limit, req.user.id);
      return this.sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getRecent(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const transactions = await TransactionService.getRecentTransactions(days, req.user.id);
      return this.sendSuccess(res, transactions, 'Recent transactions retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req, res) {
    try {
      const transaction = await TransactionService.createTransaction(req.body, req.user.id);
      return this.sendCreated(res, transaction, 'Transaction created successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req, res) {
    try {
      const transaction = await TransactionService.updateTransaction(req.params.id, req.body, req.user.id);
      return this.sendSuccess(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async delete(req, res) {
    try {
      await TransactionService.deleteTransaction(req.params.id, req.user.id);
      return this.sendSuccess(res, null, 'Transaction deleted successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return this.sendBadRequest(res, 'startDate and endDate are required');
      }
      const transactions = await TransactionService.getTransactionsByDateRange(startDate, endDate, req.user.id);
      return this.sendSuccess(res, transactions, 'Transactions retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new TransactionController();
