/**
 * Portfolio Controller
 * Single Responsibility: Handle HTTP requests for portfolio data
 */
const BaseController = require('./BaseController');
const PortfolioService = require('../services/PortfolioService');

class PortfolioController extends BaseController {
  async getDashboard(req, res) {
    try {
      const dashboard = await PortfolioService.getDashboardData(req.user.id);
      return this.sendSuccess(res, dashboard, 'Dashboard data retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateCurrentPrice(req, res) {
    try {
      const { categoryId } = req.params;
      const { current_price } = req.body;

      if (current_price === undefined || current_price < 0) {
        return this.sendBadRequest(res, 'Valid current_price is required');
      }

      const holding = await PortfolioService.updateCurrentPrice(categoryId, current_price, req.user.id);
      return this.sendSuccess(res, holding, 'Current price updated successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async createSnapshot(req, res) {
    try {
      const snapshots = await PortfolioService.createDailySnapshot(req.user.id);
      return this.sendCreated(res, snapshots, 'Daily snapshot created successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new PortfolioController();
