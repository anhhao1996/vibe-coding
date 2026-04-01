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
   * Lấy giá quỹ Fmarket theo slug URL (vd: dcds, dcbf)
   */
  async getFmarketProductPrice(req, res) {
    try {
      const { productSlug } = req.params;
      const priceData = await ExternalPriceService.getFmarketProductPrice(productSlug);
      return this.sendSuccess(res, priceData, 'Fmarket product price fetched successfully');
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
   * Lấy giá quỹ Fmarket và tự động cập nhật cho category
   * Body/query: slug (mặc định dcds), ví dụ vesaf, dcbf
   */
  async updateCategoryWithFmarketPrice(req, res) {
    try {
      const { categoryId } = req.params;
      const slug =
        req.body?.slug ??
        req.query?.slug ??
        'dcds';

      // Kiểm tra category thuộc về user
      const belongsToUser = await CategoryService.verifyCategoryOwnership(categoryId, req.user.id);
      if (!belongsToUser) {
        return this.sendNotFound(res, 'Category not found');
      }
      
      const priceData = await ExternalPriceService.getFmarketProductPrice(slug);
      
      // Lấy holding của category
      const holding = await Holding.findByCategory(categoryId);
      if (!holding) {
        return this.sendNotFound(res, 'Category holding not found');
      }

      // Cập nhật current_price (giá 1 đơn vị)
      await PortfolioService.updateCurrentPrice(categoryId, priceData.price, req.user.id);

      // Tính giá trị mới = giá * số lượng (để trả về cho frontend)
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

      return this.sendSuccess(res, {
        price: priceData.price,
        date: priceData.date,
        quantity: quantity,
        newValue: newValue,
        source: priceData.source,
        fundSlug: priceData.fundSlug,
        fundCode: priceData.fundCode
      }, 'Category value updated with Fmarket fund price');
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

      // Cập nhật current_price (giá 1 đơn vị/lượng)
      await PortfolioService.updateCurrentPrice(categoryId, priceData.price, req.user.id);

      // Tính giá trị mới = giá * số lượng (để trả về cho frontend)
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

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

      // Cập nhật current_price (tỷ giá 1 USD)
      await PortfolioService.updateCurrentPrice(categoryId, priceData.price, req.user.id);

      // Tính giá trị mới = tỷ giá * số lượng USD (để trả về cho frontend)
      const quantity = parseFloat(holding.quantity) || 0;
      const newValue = quantity * priceData.price;

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
