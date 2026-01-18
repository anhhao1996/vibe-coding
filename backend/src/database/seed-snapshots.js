/**
 * Seed Portfolio Snapshots - Tạo test data cho biểu đồ biến thiên
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedSnapshots() {
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

    // Lấy danh sách categories với holdings
    const [categories] = await connection.query(`
      SELECT c.id, c.name, h.total_invested, h.current_value, h.quantity
      FROM categories c
      LEFT JOIN holdings h ON c.id = h.category_id
      WHERE h.quantity > 0
    `);

    if (categories.length === 0) {
      console.log('⚠️ Không có category nào có holdings. Hãy thêm giao dịch trước.');
      return;
    }

    console.log(`📊 Tìm thấy ${categories.length} categories với holdings`);

    // Xóa snapshots cũ (optional)
    await connection.query('DELETE FROM portfolio_snapshots');
    console.log('🗑️ Đã xóa snapshots cũ');

    // Tạo snapshots cho 30 ngày gần nhất
    const days = 30;
    const today = new Date();
    
    for (const category of categories) {
      const baseInvested = parseFloat(category.total_invested) || 0;
      const currentValue = parseFloat(category.current_value) || baseInvested;
      
      // Tạo biến thiên ngẫu nhiên cho mỗi ngày
      let previousValue = baseInvested * 0.85; // Bắt đầu thấp hơn 15%
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Tính giá trị với biến động ngẫu nhiên
        let dailyChange;
        if (i === 0) {
          // Ngày hôm nay = giá trị thực tế
          dailyChange = currentValue;
        } else {
          // Ngày trước: tăng/giảm ngẫu nhiên từ -3% đến +5%
          const changePercent = (Math.random() * 8 - 3) / 100;
          dailyChange = previousValue * (1 + changePercent);
          
          // Đảm bảo xu hướng hướng về current value
          const targetProgress = (days - i) / days;
          dailyChange = previousValue + (currentValue - previousValue) * targetProgress * (0.8 + Math.random() * 0.4);
        }
        
        const totalValue = Math.max(dailyChange, baseInvested * 0.5); // Không để âm quá nhiều
        const pnl = totalValue - baseInvested;
        const pnlPercentage = baseInvested > 0 ? (pnl / baseInvested * 100) : 0;
        
        await connection.query(`
          INSERT INTO portfolio_snapshots (category_id, snapshot_date, total_value, total_invested, pnl, pnl_percentage)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_value = VALUES(total_value),
            total_invested = VALUES(total_invested),
            pnl = VALUES(pnl),
            pnl_percentage = VALUES(pnl_percentage)
        `, [category.id, dateStr, totalValue.toFixed(2), baseInvested.toFixed(2), pnl.toFixed(2), pnlPercentage.toFixed(4)]);
        
        previousValue = totalValue;
      }
      
      console.log(`✅ Tạo ${days + 1} snapshots cho "${category.name}"`);
    }

    // Kiểm tra kết quả
    const [count] = await connection.query('SELECT COUNT(*) as total FROM portfolio_snapshots');
    console.log(`\n🎉 Hoàn thành! Tổng cộng ${count[0].total} snapshots được tạo.`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedSnapshots();
