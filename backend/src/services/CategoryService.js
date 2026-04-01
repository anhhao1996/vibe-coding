/**
 * Category Service
 * Interface Segregation: Chỉ expose những methods cần thiết
 * Single Responsibility: Business logic cho categories
 */
const Category = require('../models/Category');
const db = require('../config/database');

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

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [insertCat] = await connection.query(
        `INSERT INTO categories (user_id, name, description, color) VALUES (?, ?, ?, ?)`,
        [userId, data.name, data.description || null, data.color || '#4CAF50']
      );
      const categoryId = insertCat.insertId;

      await connection.query(
        `INSERT INTO holdings (category_id, quantity, average_price, total_invested, current_value)
         VALUES (?, 0, 0, 0, 0)`,
        [categoryId]
      );

      await connection.commit();
      return await Category.findById(categoryId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
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
