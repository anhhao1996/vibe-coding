/**
 * Migration: Add current_price column to holdings table
 * 
 * Changes:
 * - Add current_price column (unit price)
 * - Calculate current_price from existing data (current_value / quantity)
 * - current_value will now be calculated on-the-fly as: current_price * quantity
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

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

    console.log('🔄 Starting migration: Add current_price column...\n');

    // 1. Add current_price column to holdings table if not exists
    console.log('1. Adding current_price column to holdings table...');
    try {
      await connection.query(`
        ALTER TABLE holdings 
        ADD COLUMN current_price DECIMAL(15, 4) NOT NULL DEFAULT 0 
        AFTER average_price
      `);
      console.log('   ✓ Column current_price added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️ Column current_price already exists, skipping...');
      } else {
        throw err;
      }
    }

    // 2. Calculate current_price from existing data
    console.log('\n2. Calculating current_price from existing data...');
    
    const [holdings] = await connection.query(`SELECT * FROM holdings`);

    for (const holding of holdings) {
      const quantity = parseFloat(holding.quantity) || 0;
      const currentValue = parseFloat(holding.current_value) || 0;
      
      // Calculate unit price from current_value / quantity
      const currentPrice = quantity > 0 ? currentValue / quantity : 0;
      
      await connection.query(`
        UPDATE holdings 
        SET current_price = ?
        WHERE id = ?
      `, [currentPrice, holding.id]);

      console.log(`   ✓ Category ${holding.category_id}: quantity=${quantity}, current_value=${currentValue}, current_price=${currentPrice.toFixed(4)}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew business logic:');
    console.log('  - current_price: Giá hiện tại (1 đơn vị) - Được lưu trong DB');
    console.log('  - current_value: Giá trị hiện tại = current_price × quantity - Tính on-the-fly');

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
