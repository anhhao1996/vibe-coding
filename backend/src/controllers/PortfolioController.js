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

  async getOverview(req, res) {
    try {
      const overview = await PortfolioService.getPortfolioOverview(req.user.id);
      return this.sendSuccess(res, overview, 'Portfolio overview retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getDistribution(req, res) {
    try {
      const distribution = await PortfolioService.getPortfolioDistribution(req.user.id);
      return this.sendSuccess(res, distribution, 'Portfolio distribution retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getPnlByCategory(req, res) {
    try {
      const pnl = await PortfolioService.getPnlByCategory(req.user.id);
      return this.sendSuccess(res, pnl, 'PnL by category retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getPnl7Days(req, res) {
    try {
      const pnl = await PortfolioService.getPnlLast7Days(req.user.id);
      return this.sendSuccess(res, pnl, 'PnL last 7 days retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getHistory(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const history = await PortfolioService.getPortfolioHistory(days, req.user.id);
      return this.sendSuccess(res, history, 'Portfolio history retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateCurrentValue(req, res) {
    try {
      const { categoryId } = req.params;
      const { current_value } = req.body;

      if (current_value === undefined || current_value < 0) {
        return this.sendBadRequest(res, 'Valid current_value is required');
      }

      const holding = await PortfolioService.updateCurrentValue(categoryId, current_value, req.user.id);
      return this.sendSuccess(res, holding, 'Current value updated successfully');
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
