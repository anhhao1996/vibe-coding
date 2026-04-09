/**
 * Category Service
 * Business logic cho categories
 */
const Category = require('../models/Category');
const db = require('../config/database');

class CategoryService {
  async getAllCategories(userId) {
    return Category.findWithHoldings(userId);
  }

  async createCategory(data, userId) {
    const existing = await Category.findByName(data.name, userId);
    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return db.transaction(async (trx) => {
      const [categoryId] = await trx('categories').insert({
        user_id: userId,
        name: data.name,
        description: data.description || null,
        color: data.color || '#4CAF50'
      });

      await trx('holdings').insert({
        category_id: categoryId,
        quantity: 0,
        average_price: 0,
        total_invested: 0,
        current_value: 0
      });

      return Category.findById(categoryId);
    });
  }

  async updateCategory(id, data, userId) {
    const belongsToUser = await Category.belongsToUser(id, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }

    const existing = await Category.findById(id);

    if (data.name && data.name !== existing.name) {
      const duplicate = await Category.findByName(data.name, userId);
      if (duplicate) {
        throw new Error('Category with this name already exists');
      }
    }

    return Category.update(id, {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      color: data.color || existing.color
    });
  }

  async deleteCategory(id, userId) {
    const belongsToUser = await Category.belongsToUser(id, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }

    return Category.delete(id);
  }

  async verifyCategoryOwnership(categoryId, userId) {
    return Category.belongsToUser(categoryId, userId);
  }
}

module.exports = new CategoryService();
