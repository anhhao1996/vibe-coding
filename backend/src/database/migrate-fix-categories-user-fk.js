/**
 * Sửa FK categories.user_id khi bị trỏ nhầm sang database khác (vd: test.users trên TiDB)
 * Chạy: node src/database/migrate-fix-categories-user-fk.js
 * Toàn bộ FK: ưu tiên `migrate-fix-all-cross-schema-fks.js` (npm run db:fix-cross-schema-fks)
 */
const path = require('path');
const mysql = require('mysql2/promise');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });

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

  const [fks] = await connection.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'categories'
       AND COLUMN_NAME = 'user_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [dbName]
  );

  for (const row of fks) {
    const name = row.CONSTRAINT_NAME;
    await connection.query(`ALTER TABLE categories DROP FOREIGN KEY \`${name}\``);
    console.log(`✓ Dropped FK: ${name}`);
  }

  if (fks.length === 0) {
    console.log('ℹ No user_id FK on categories (already fixed or missing).');
  }

  await connection.query(`
    ALTER TABLE categories
    ADD CONSTRAINT categories_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  `);
  console.log('✓ Added FK: categories.user_id → users(id)');

  await connection.end();
  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
