/**
 * Sửa FK của portfolio_snapshots khi bị trỏ nhầm sang database khác (vd: test.categories từ TiDB)
 * chạy: node src/database/migrate-fix-portfolio-snapshot-fk.js
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
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'portfolio_snapshots'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [dbName]
  );

  for (const row of fks) {
    const name = row.CONSTRAINT_NAME;
    await connection.query(`ALTER TABLE portfolio_snapshots DROP FOREIGN KEY \`${name}\``);
    console.log(`✓ Dropped FK: ${name}`);
  }

  await connection.query(`
    ALTER TABLE portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_category_fk
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  `);
  console.log('✓ Added FK: portfolio_snapshots.category_id → categories(id)');

  await connection.end();
  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
