/**
 * Category Controller
 * Single Responsibility: Handle HTTP requests for categories
 */
const BaseController = require('./BaseController');
const CategoryService = require('../services/CategoryService');

class CategoryController extends BaseController {
  async getAll(req, res) {
    try {
      const categories = await CategoryService.getAllCategories(req.user.id);
      return this.sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id, req.user.id);
      return this.sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async create(req, res) {
    try {
      const category = await CategoryService.createCategory(req.body, req.user.id);
      return this.sendCreated(res, category, 'Category created successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async update(req, res) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body, req.user.id);
      return this.sendSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async delete(req, res) {
    try {
      await CategoryService.deleteCategory(req.params.id, req.user.id);
      return this.sendSuccess(res, null, 'Category deleted successfully');
    } catch (error) {
      return this.handleError(res, error);
    }
  }
}

module.exports = new CategoryController();
