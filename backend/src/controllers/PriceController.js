/**
 * Price Controller
 * Handle external price API requests
 */
const BaseController = require('./BaseController');
const ExternalPriceService = require('../services/ExternalPriceService');
const PortfolioService = require('../services/PortfolioService');
const CategoryService = require('../services/CategoryService');
const Holding = require('../models/Holding');

class PriceController extends BaseController {
  /**
   * Lấy giá DCDS từ Dragon Capital
   */
  async getDCDSPrice(req, res) {
    try {
      const priceData = await ExternalPriceService.getDCDSPrice();
      return this.sendSuccess(res, priceData, 'DCDS price fetched successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy giá theo fund code
   */
  async getPriceByFundCode(req, res) {
    try {
      const { fundCode } = req.params;
      const priceData = await ExternalPriceService.getPriceByFundCode(fundCode);
      return this.sendSuccess(res, priceData, 'Price fetched successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy giá DCDS và tự động cập nhật cho category
   */
  async updateCategoryWithDCDSPrice(req, res) {
    try {
      const { categoryId } = req.params;
      
      // Kiểm tra category thuộc về user
      const belongsToUser = await CategoryService.verifyCategoryOwnership(categoryId, req.user.id);
      if (!belongsToUser) {
        return this.sendNotFound(res, 'Category not found');
      }
      
      // Lấy giá từ API
      const priceData = await ExternalPriceService.getDCDSPrice();
      
      // Lấy holding của category
      const holding = await Holding.findByCategory(categoryId);
      if (!holding) {
        return this.sendNotFound(res, 'Category holding not found');
      }

      // Tính giá trị mới = giá * số lượng
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

      // Cập nhật current_value
      await PortfolioService.updateCurrentValue(categoryId, newValue, req.user.id);

      return this.sendSuccess(res, {
        price: priceData.price,
        date: priceData.date,
        quantity: quantity,
        newValue: newValue,
        source: priceData.source
      }, 'Category value updated with DCDS price');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy giá vàng SJC
   */
  async getGoldPrice(req, res) {
    try {
      const priceData = await ExternalPriceService.getGoldPrice();
      return this.sendSuccess(res, priceData, 'Gold price fetched successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy giá vàng và tự động cập nhật cho category
   */
  async updateCategoryWithGoldPrice(req, res) {
    try {
      const { categoryId } = req.params;
      
      // Kiểm tra category thuộc về user
      const belongsToUser = await CategoryService.verifyCategoryOwnership(categoryId, req.user.id);
      if (!belongsToUser) {
        return this.sendNotFound(res, 'Category not found');
      }
      
      // Lấy giá từ API
      const priceData = await ExternalPriceService.getGoldPrice();
      
      // Lấy holding của category
      const holding = await Holding.findByCategory(categoryId);
      if (!holding) {
        return this.sendNotFound(res, 'Category holding not found');
      }

      // Tính giá trị mới = giá * số lượng (giá vàng tính theo lượng)
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

      // Cập nhật current_value
      await PortfolioService.updateCurrentValue(categoryId, newValue, req.user.id);

      return this.sendSuccess(res, {
        price: priceData.price,
        date: priceData.date,
        quantity: quantity,
        newValue: newValue,
        source: priceData.source,
        type: priceData.type
      }, 'Category value updated with gold price');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy tỷ giá USD từ Vietcombank
   */
  async getUSDPrice(req, res) {
    try {
      const priceData = await ExternalPriceService.getUSDPrice();
      return this.sendSuccess(res, priceData, 'USD price fetched successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  /**
   * Lấy tỷ giá USD và tự động cập nhật cho category
   */
  async updateCategoryWithUSDPrice(req, res) {
    try {
      const { categoryId } = req.params;
      
      // Kiểm tra category thuộc về user
      const belongsToUser = await CategoryService.verifyCategoryOwnership(categoryId, req.user.id);
      if (!belongsToUser) {
        return this.sendNotFound(res, 'Category not found');
      }
      
      // Lấy giá từ API
      const priceData = await ExternalPriceService.getUSDPrice();
      
      // Lấy holding của category
      const holding = await Holding.findByCategory(categoryId);
      if (!holding) {
        return this.sendNotFound(res, 'Category holding not found');
      }

      // Tính giá trị mới = tỷ giá * số lượng USD
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

      // Cập nhật current_value
      await PortfolioService.updateCurrentValue(categoryId, newValue, req.user.id);

      return this.sendSuccess(res, {
        price: priceData.price,
        date: priceData.date,
        quantity: quantity,
        newValue: newValue,
        source: priceData.source,
        currencyCode: priceData.currencyCode
      }, 'Category value updated with USD price');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new PriceController();
