/**
 * Category Service
 * Interface Segregation: Chỉ expose những methods cần thiết
 * Single Responsibility: Business logic cho categories
 */
const Category = require('../models/Category');
const Holding = require('../models/Holding');

class CategoryService {
  async getAllCategories(userId) {
    return await Category.findWithHoldings(userId);
  }

  async getCategoryById(id, userId) {
    const category = await Category.getCategoryWithDetails(id, userId);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async createCategory(data, userId) {
    // Kiểm tra trùng tên trong phạm vi user
    const existing = await Category.findByName(data.name, userId);
    if (existing) {
      throw new Error('Category with this name already exists');
    }

    const category = await Category.create({
      user_id: userId,
      name: data.name,
      description: data.description || null,
      color: data.color || '#4CAF50'
    });

    // Tạo holding record mặc định
    await Holding.create({
      category_id: category.id,
      quantity: 0,
      average_price: 0,
      total_invested: 0,
      current_value: 0
    });

    return category;
  }

  async updateCategory(id, data, userId) {
    // Kiểm tra category thuộc về user
    const belongsToUser = await Category.belongsToUser(id, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }

    const existing = await Category.findById(id);

    // Kiểm tra trùng tên với category khác của cùng user
    if (data.name && data.name !== existing.name) {
      const duplicate = await Category.findByName(data.name, userId);
      if (duplicate) {
        throw new Error('Category with this name already exists');
      }
    }

    return await Category.update(id, {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      color: data.color || existing.color
    });
  }

  async deleteCategory(id, userId) {
    // Kiểm tra category thuộc về user
    const belongsToUser = await Category.belongsToUser(id, userId);
    if (!belongsToUser) {
      throw new Error('Category not found');
    }
    
    return await Category.delete(id);
  }

  // Kiểm tra category thuộc về user (cho các service khác sử dụng)
  async verifyCategoryOwnership(categoryId, userId) {
    return await Category.belongsToUser(categoryId, userId);
  }
}

module.exports = new CategoryService();
