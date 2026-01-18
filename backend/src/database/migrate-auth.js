/**
 * Auth Migration Script
 * Tạo bảng users và thêm user_id vào các bảng hiện có
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function migrateAuth() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'investment_tracker'
    });

    console.log('🔗 Connected to database\n');

    // 1. Tạo bảng users
    console.log('📦 Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created\n');

    // 2. Tạo admin user với password hash
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    // Check if admin exists
    const [existingAdmin] = await connection.query(
      'SELECT id FROM users WHERE username = ?', ['admin']
    );

    let adminId;
    if (existingAdmin.length === 0) {
      const [result] = await connection.query(
        'INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'Administrator']
      );
      adminId = result.insertId;
      console.log('✓ Admin user created (username: admin, password: admin)\n');
    } else {
      adminId = existingAdmin[0].id;
      console.log('✓ Admin user already exists\n');
    }

    // 3. Thêm cột user_id vào categories (nếu chưa có)
    console.log('📦 Adding user_id to categories...');
    const [catColumns] = await connection.query('SHOW COLUMNS FROM categories LIKE "user_id"');
    if (catColumns.length === 0) {
      await connection.query('ALTER TABLE categories ADD COLUMN user_id INT AFTER id');
      await connection.query('ALTER TABLE categories ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      // Gán data hiện tại cho admin
      await connection.query('UPDATE categories SET user_id = ? WHERE user_id IS NULL', [adminId]);
      console.log('✓ user_id added to categories\n');
    } else {
      console.log('✓ user_id already exists in categories\n');
    }

    // 4. Thêm cột user_id vào monthly_expenses (nếu chưa có)
    console.log('📦 Adding user_id to monthly_expenses...');
    const [expColumns] = await connection.query('SHOW COLUMNS FROM monthly_expenses LIKE "user_id"');
    if (expColumns.length === 0) {
      await connection.query('ALTER TABLE monthly_expenses ADD COLUMN user_id INT AFTER id');
      await connection.query('ALTER TABLE monthly_expenses ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      // Gán data hiện tại cho admin
      await connection.query('UPDATE monthly_expenses SET user_id = ? WHERE user_id IS NULL', [adminId]);
      // Xóa unique constraint cũ và tạo mới với user_id
      try {
        await connection.query('ALTER TABLE monthly_expenses DROP INDEX unique_month');
      } catch (e) { /* Index might not exist */ }
      await connection.query('ALTER TABLE monthly_expenses ADD UNIQUE KEY unique_user_month (user_id, month)');
      console.log('✓ user_id added to monthly_expenses\n');
    } else {
      console.log('✓ user_id already exists in monthly_expenses\n');
    }

    console.log('🎉 Auth migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Users table created');
    console.log('   - Admin account: username=admin, password=admin');
    console.log('   - Existing data linked to admin user');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateAuth();
