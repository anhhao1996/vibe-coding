/**
 * User Settings Model
 * Quản lý cài đặt của user
 */
const BaseModel = require('./BaseModel');

class UserSettings extends BaseModel {
  constructor() {
    super('user_settings');
  }

  async getSetting(userId, settingKey) {
    const row = await this.qb()
      .select('setting_value')
      .where({ user_id: userId, setting_key: settingKey })
      .first();
    return row ? row.setting_value : null;
  }

  async saveSetting(userId, settingKey, settingValue) {
    await this.db.raw(
      `INSERT INTO ${this.tableName} (user_id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [userId, settingKey, JSON.stringify(settingValue)]
    );
    return settingValue;
  }

  async deleteSetting(userId, settingKey) {
    await this.qb()
      .where({ user_id: userId, setting_key: settingKey })
      .del();
    return true;
  }
}

module.exports = new UserSettings();
