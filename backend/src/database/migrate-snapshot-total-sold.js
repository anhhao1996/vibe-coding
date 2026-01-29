/**
 * Migration: Add total_sold column to portfolio_snapshots table
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

    console.log('🔄 Adding total_sold column to portfolio_snapshots...\n');

    try {
      await connection.query(`
        ALTER TABLE portfolio_snapshots 
        ADD COLUMN total_sold DECIMAL(15, 2) NOT NULL DEFAULT 0 
        AFTER total_invested
      `);
      console.log('✓ Column total_sold added to portfolio_snapshots');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Column total_sold already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration completed!');

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
