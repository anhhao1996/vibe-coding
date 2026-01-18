/**
 * Clear Portfolio Snapshots - Xóa toàn bộ snapshots
 * Chỉ xóa bảng portfolio_snapshots, không ảnh hưởng categories, transactions, holdings
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearSnapshots() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'investment_tracker'
    });

    console.log('🔗 Connected to database');

    // Đếm số snapshots hiện tại
    const [countBefore] = await connection.query('SELECT COUNT(*) as total FROM portfolio_snapshots');
    console.log(`📊 Số snapshots hiện tại: ${countBefore[0].total}`);

    if (countBefore[0].total === 0) {
      console.log('⚠️ Không có snapshots nào để xóa.');
      return;
    }

    // Xác nhận
    console.log('\n⚠️ CẢNH BÁO: Script này sẽ xóa toàn bộ dữ liệu trong bảng portfolio_snapshots!');
    console.log('   Các bảng khác (categories, transactions, holdings) KHÔNG bị ảnh hưởng.\n');

    // Xóa snapshots
    await connection.query('DELETE FROM portfolio_snapshots');
    
    // Reset auto_increment về 1
    await connection.query('ALTER TABLE portfolio_snapshots AUTO_INCREMENT = 1');

    console.log('✅ Đã xóa toàn bộ portfolio_snapshots!');
    console.log('🎉 Hoàn thành! Dữ liệu snapshots đã được xóa sạch.');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearSnapshots();
