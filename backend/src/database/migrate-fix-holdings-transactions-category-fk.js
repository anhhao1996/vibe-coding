/**
 * Sửa FK category_id trên holdings / transactions khi trỏ nhầm sang test.categories (TiDB/MySQL)
 * Chạy: node src/database/migrate-fix-holdings-transactions-category-fk.js
 * Toàn bộ FK: ưu tiên `migrate-fix-all-cross-schema-fks.js` (npm run db:fix-cross-schema-fks)
 */
const path = require('path');
const mysql = require('mysql2/promise');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });

async function fixTable(connection, dbName, tableName, columnName, constraintName) {
  const [fks] = await connection.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [dbName, tableName, columnName]
  );

  for (const row of fks) {
    const name = row.CONSTRAINT_NAME;
    await connection.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${name}\``);
    console.log(`✓ ${tableName}: dropped FK ${name}`);
  }

  if (fks.length === 0) {
    console.log(`ℹ ${tableName}.${columnName}: no FK to replace`);
  }

  await connection.query(`
    ALTER TABLE \`${tableName}\`
    ADD CONSTRAINT \`${constraintName}\`
    FOREIGN KEY (\`${columnName}\`) REFERENCES categories(id) ON DELETE CASCADE
  `);
  console.log(`✓ ${tableName}: ${columnName} → categories(id)`);
}

async function main() {
  const dbName = process.env.DB_NAME || 'investment_tracker';
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  };
  if (process.env.DB_SSL === 'true') {
    connectionConfig.ssl = { rejectUnauthorized: true };
  }

  const connection = await mysql.createConnection(connectionConfig);

  await fixTable(connection, dbName, 'holdings', 'category_id', 'holdings_category_id_fk');
  await fixTable(connection, dbName, 'transactions', 'category_id', 'transactions_category_id_fk');

  await connection.end();
  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
