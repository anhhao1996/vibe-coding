/**
 * User Settings Model
 * Quản lý cài đặt của user
 */
const BaseModel = require('./BaseModel');

class UserSettings extends BaseModel {
  constructor() {
    super('user_settings');
  }

  /**
   * Lấy setting theo key của user
   */
  async getSetting(userId, settingKey) {
    const sql = `SELECT setting_value FROM ${this.tableName} WHERE user_id = ? AND setting_key = ?`;
    const results = await this.db.query(sql, [userId, settingKey]);
    if (results[0]) {
      return results[0].setting_value;
    }
    return null;
  }

  /**
   * Lưu setting cho user (insert hoặc update)
   */
  async saveSetting(userId, settingKey, settingValue) {
    const sql = `
      INSERT INTO ${this.tableName} (user_id, setting_key, setting_value)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    await this.db.query(sql, [userId, settingKey, JSON.stringify(settingValue)]);
    return settingValue;
  }

  /**
   * Xóa setting của user
   */
  async deleteSetting(userId, settingKey) {
    const sql = `DELETE FROM ${this.tableName} WHERE user_id = ? AND setting_key = ?`;
    await this.db.query(sql, [userId, settingKey]);
    return true;
  }
}

module.exports = new UserSettings();
