/**
 * Portfolio Service
 * Single Responsibility: Business logic cho portfolio analytics
 */
const Holding = require('../models/Holding');
const PortfolioSnapshot = require('../models/PortfolioSnapshot');
const Category = require('../models/Category');

class PortfolioService {
  async getPortfolioOverview(userId) {
    const [holdings, totals] = await Promise.all([
      Holding.getAllWithCategories(userId),
      Holding.getTotalPortfolio(userId)
    ]);

    return {
      holdings: holdings,
      summary: {
        total_invested: parseFloat(totals.total_invested) || 0,
        total_value: parseFloat(totals.total_value) || 0,
        total_pnl: parseFloat(totals.total_pnl) || 0,
        total_pnl_percentage: parseFloat(totals.total_pnl_percentage) || 0
      }
    };
  }

  async getPortfolioDistribution(userId) {
    const holdings = await Holding.getAllWithCategories(userId);
    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0);

    return holdings.map(holding => ({
      category_id: holding.category_id,
      category_name: holding.category_name,
      color: holding.category_color,
      value: parseFloat(holding.current_value) || 0,
      percentage: totalValue > 0 
        ? ((parseFloat(holding.current_value) || 0) / totalValue * 100) 
        : 0
    }));
  }

  async getPnlByCategory(userId) {
    const holdings = await Holding.getAllWithCategories(userId);

    return holdings.map(holding => ({
      category_id: holding.category_id,
      category_name: holding.category_name,
      color: holding.category_color,
      total_invested: parseFloat(holding.total_invested) || 0,
      current_value: parseFloat(holding.current_value) || 0,
      pnl: parseFloat(holding.pnl) || 0,
      pnl_percentage: parseFloat(holding.pnl_percentage) || 0
    }));
  }

  async getPnlLast7Days(userId) {
    return await PortfolioSnapshot.getPnlLast7Days(userId);
  }

  async getPortfolioHistory(days = 30, userId) {
    return await PortfolioSnapshot.getPortfolioHistory(days, userId);
  }

  async updateCurrentValue(categoryId, currentValue, userId) {
    // Kiểm tra category thuộc về user
    const belongsToUser = await Category.belongsToUser(categoryId, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }

    const holding = await Holding.findByCategory(categoryId);
    if (!holding) {
      throw new Error('Holding not found for this category');
    }

    return await Holding.update(holding.id, {
      current_value: currentValue
    });
  }

  async createDailySnapshot(userId) {
    const holdings = await Holding.getAllWithCategories(userId);
    const today = new Date().toISOString().split('T')[0];

    const snapshots = [];
    for (const holding of holdings) {
      const snapshot = await PortfolioSnapshot.createOrUpdateSnapshot(
        holding.category_id,
        today,
        {
          total_value: holding.current_value,
          total_invested: holding.total_invested,
          pnl: holding.pnl,
          pnl_percentage: holding.pnl_percentage
        }
      );
      snapshots.push(snapshot);
    }

    return snapshots;
  }

  async getDashboardData(userId) {
    const [overview, distribution, pnlByCategory, pnl7Days, history] = await Promise.all([
      this.getPortfolioOverview(userId),
      this.getPortfolioDistribution(userId),
      this.getPnlByCategory(userId),
      this.getPnlLast7Days(userId),
      this.getPortfolioHistory(30, userId)
    ]);

    return {
      overview: overview.summary,
      holdings: overview.holdings,
      distribution,
      pnlByCategory,
      pnl7Days,
      portfolioHistory: history
    };
  }
}

module.exports = new PortfolioService();
