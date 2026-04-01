/**
 * Rà soát và sửa mọi FOREIGN KEY trong DB hiện tại đang tham chiếu sang schema khác
 * (vd: test.users, test.categories trên TiDB/MySQL khi USE nhầm database).
 *
 * Cách làm: đọc information_schema → DROP FK cũ → tạo lại trỏ tới bảng cùng tên trong DB_NAME.
 *
 * Chạy: node src/database/migrate-fix-all-cross-schema-fks.js
 *
 * Các bảng trong codebase có FK (migrate.js / migrate-auth / migrate-user-settings):
 * - transactions, portfolio_snapshots, holdings → categories
 * - expense_items → monthly_expenses
 * - savings_transactions → savings_books
 * - categories, monthly_expenses, user_settings → users
 *
 * Lưu ý: savings_books.user_id và savings_snapshots.user_id trong migrate.js KHÔNG có FK
 * (chỉ có cột INT) — không phải lỗi cross-schema, nhưng cũng không có ràng buộc DB.
 */
const path = require('path');
const mysql = require('mysql2/promise');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });

function mapRule(rule) {
  if (!rule) return 'RESTRICT';
  const r = String(rule).toUpperCase();
  if (r === 'NO ACTION') return 'NO ACTION';
  return r;
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

  const [rows] = await connection.query(
    `SELECT 
      k.CONSTRAINT_NAME,
      k.TABLE_NAME,
      k.COLUMN_NAME,
      k.ORDINAL_POSITION,
      k.REFERENCED_TABLE_SCHEMA,
      k.REFERENCED_TABLE_NAME,
      k.REFERENCED_COLUMN_NAME,
      rc.DELETE_RULE,
      rc.UPDATE_RULE
    FROM information_schema.KEY_COLUMN_USAGE k
    INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
      ON k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
      AND k.TABLE_NAME = rc.TABLE_NAME
      AND k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    WHERE k.TABLE_SCHEMA = ?
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
      AND k.REFERENCED_TABLE_SCHEMA IS NOT NULL
      AND k.REFERENCED_TABLE_SCHEMA <> ?
    ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`,
    [dbName, dbName]
  );

  if (rows.length === 0) {
    console.log(`✓ Không có FK nào trỏ sang schema khác (ngoài ${dbName}).`);
    await connection.end();
    return;
  }

  const byKey = new Map();
  for (const row of rows) {
    const key = `${row.TABLE_NAME}\0${row.CONSTRAINT_NAME}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }

  for (const [, cols] of byKey) {
    cols.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);
    const first = cols[0];
    const { TABLE_NAME: table, CONSTRAINT_NAME: cname } = first;
    const refTable = first.REFERENCED_TABLE_NAME;
    const delRule = mapRule(first.DELETE_RULE);
    const updRule = mapRule(first.UPDATE_RULE);

    const childCols = cols.map((c) => `\`${c.COLUMN_NAME}\``).join(', ');
    const parentCols = cols.map((c) => `\`${c.REFERENCED_COLUMN_NAME}\``).join(', ');

    await connection.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${cname}\``);
    console.log(`✓ Dropped FK \`${cname}\` on ${table} (was → ${first.REFERENCED_TABLE_SCHEMA}.${refTable})`);

    await connection.query(
      `ALTER TABLE \`${table}\`
       ADD CONSTRAINT \`${cname}\`
       FOREIGN KEY (${childCols})
       REFERENCES \`${refTable}\` (${parentCols})
       ON DELETE ${delRule}
       ON UPDATE ${updRule}`
    );
    console.log(`✓ Recreated ${table} → ${refTable} (${childCols})`);
  }

  await connection.end();
  console.log('\n✅ migrate-fix-all-cross-schema-fks hoàn tất.');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
