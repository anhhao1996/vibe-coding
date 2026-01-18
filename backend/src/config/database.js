/**
 * Database Configuration
 * Single Responsibility: Chỉ quản lý kết nối database
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseConfig {
  constructor() {
    this.pool = null;
  }

  async getPool() {
    if (!this.pool) {
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'investment_tracker',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      };

      // Enable SSL for cloud databases (TiDB, PlanetScale, etc.)
      if (process.env.DB_SSL === 'true') {
        config.ssl = {
          rejectUnauthorized: true
        };
      }

      this.pool = mysql.createPool(config);
    }
    return this.pool;
  }

  async query(sql, params = []) {
    const pool = await this.getPool();
    const [results] = await pool.query(sql, params);
    return results;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Singleton pattern
module.exports = new DatabaseConfig();
