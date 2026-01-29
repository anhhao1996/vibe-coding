/**
 * Migration: Add total_sold column to holdings table
 * 
 * Changes:
 * - Add total_sold column to holdings table
 * - Recalculate total_invested and total_sold from transactions
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  let connection;
  
  try {
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'investment_tracker'
    };

    // Enable SSL for TiDB Cloud
    if (process.env.DB_SSL === 'true') {
      connectionConfig.ssl = { rejectUnauthorized: true };
    }

    connection = await mysql.createConnection(connectionConfig);

    console.log('🔄 Starting migration: Add total_sold column...\n');

    // 1. Add total_sold column to holdings table if not exists
    console.log('1. Adding total_sold column to holdings table...');
    try {
      await connection.query(`
        ALTER TABLE holdings 
        ADD COLUMN total_sold DECIMAL(15, 2) NOT NULL DEFAULT 0 
        AFTER total_invested
      `);
      console.log('   ✓ Column total_sold added');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️ Column total_sold already exists, skipping...');
      } else {
        throw err;
      }
    }

    // 2. Recalculate total_invested (buy only) and total_sold for all categories
    console.log('\n2. Recalculating holdings from transactions...');
    
    // Get all categories with transactions
    const [categories] = await connection.query(`
      SELECT DISTINCT category_id FROM transactions
    `);

    for (const cat of categories) {
      const categoryId = cat.category_id;
      
      // Get buy totals
      const [buyResults] = await connection.query(`
        SELECT 
          COALESCE(SUM(quantity), 0) as total_quantity,
          COALESCE(SUM(amount), 0) as total_amount
        FROM transactions
        WHERE category_id = ? AND type = 'buy'
      `, [categoryId]);
      
      // Get sell totals
      const [sellResults] = await connection.query(`
        SELECT 
          COALESCE(SUM(quantity), 0) as total_quantity,
          COALESCE(SUM(amount), 0) as total_amount
        FROM transactions
        WHERE category_id = ? AND type = 'sell'
      `, [categoryId]);

      const buyQuantity = parseFloat(buyResults[0].total_quantity) || 0;
      const buyAmount = parseFloat(buyResults[0].total_amount) || 0;
      const sellQuantity = parseFloat(sellResults[0].total_quantity) || 0;
      const sellAmount = parseFloat(sellResults[0].total_amount) || 0;

      const quantity = buyQuantity - sellQuantity;
      const totalInvested = buyAmount; // Total invested = sum of buy only
      const totalSold = sellAmount; // Total sold = sum of sell only
      const averagePrice = quantity > 0 ? (buyAmount - sellAmount) / quantity : 0;

      // Update holding
      await connection.query(`
        UPDATE holdings 
        SET quantity = ?,
            average_price = ?,
            total_invested = ?,
            total_sold = ?
        WHERE category_id = ?
      `, [quantity, averagePrice, totalInvested, totalSold, categoryId]);

      console.log(`   ✓ Category ${categoryId}: qty=${quantity}, invested=${totalInvested}, sold=${totalSold}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew formula:');
    console.log('  - Tổng đầu tư = Sum of BUY transactions');
    console.log('  - Tổng đã bán = Sum of SELL transactions');
    console.log('  - Lãi/Lỗ = (Giá trị hiện tại + Tổng đã bán) - Tổng đầu tư');

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
