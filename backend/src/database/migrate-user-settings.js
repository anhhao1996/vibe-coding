/**
 * Migration: User Settings Table
 * Lưu trữ các cài đặt của user (như tracked expense items)
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrations = [
  // User settings table
  `CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`
];

async function migrate() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'investment_tracker'
    });

    console.log('🔧 Running user_settings migration...\n');

    for (let i = 0; i < migrations.length; i++) {
      await connection.query(migrations[i]);
      console.log(`✓ Migration ${i + 1}/${migrations.length} completed`);
    }

    console.log('\n✅ User settings migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();
