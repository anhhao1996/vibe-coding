/**
 * User Model
 * Extracted from AuthService's inline raw SQL.
 */
const BaseModel = require('./BaseModel');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findByUsername(username) {
    const row = await this.qb().where({ username }).first();
    return row || null;
  }

  async findPublicById(id) {
    const row = await this.qb()
      .select('id', 'username', 'display_name', 'email', 'created_at')
      .where({ id })
      .first();
    return row || null;
  }

  async updatePassword(id, hashedPassword) {
    await this.qb().where({ id }).update({ password: hashedPassword });
  }
}

module.exports = new User();
