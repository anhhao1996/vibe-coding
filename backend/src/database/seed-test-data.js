/**
 * Seed Test Data
 * Tạo dữ liệu mẫu cho CI/E2E tests
 * Chạy sau tất cả các migration scripts
 */
const path = require('path');
const mysql = require('mysql2/promise');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });

// ─── helpers ────────────────────────────────────────────────────────────────

/** Trả về chuỗi YYYY-MM-DD tính từ hôm nay lùi n ngày */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Trả về chuỗi YYYY-MM của tháng lùi n tháng */
function monthsAgo(n) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}

// ─── data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Quỹ DCDS',   description: 'Quỹ đầu tư Dragon Capital', color: '#4CAF50' },
  { name: 'Vàng SJC',   description: 'Vàng vật chất SJC',         color: '#FFC107' },
  { name: 'USD',         description: 'Ngoại tệ đô la Mỹ',         color: '#2196F3' },
  { name: 'Cổ phiếu VNM', description: 'Vinamilk VNM',            color: '#9C27B0' },
];

// Giao dịch mua/bán cho từng category (index tương ứng CATEGORIES)
const TRANSACTIONS_BY_CATEGORY = [
  // Quỹ DCDS
  [
    { type: 'buy',  quantity: 1000,  price: 15200, amount: 15200000, date: daysAgo(180) },
    { type: 'buy',  quantity: 500,   price: 15800, amount: 7900000,  date: daysAgo(120) },
    { type: 'buy',  quantity: 300,   price: 16100, amount: 4830000,  date: daysAgo(60)  },
    { type: 'sell', quantity: 200,   price: 16500, amount: 3300000,  date: daysAgo(30)  },
  ],
  // Vàng SJC
  [
    { type: 'buy',  quantity: 2,     price: 85000000, amount: 170000000, date: daysAgo(200) },
    { type: 'buy',  quantity: 1,     price: 88000000, amount: 88000000,  date: daysAgo(90)  },
    { type: 'sell', quantity: 1,     price: 92000000, amount: 92000000,  date: daysAgo(15)  },
  ],
  // USD
  [
    { type: 'buy',  quantity: 2000,  price: 24200, amount: 48400000,  date: daysAgo(150) },
    { type: 'buy',  quantity: 1000,  price: 24500, amount: 24500000,  date: daysAgo(45)  },
    { type: 'sell', quantity: 500,   price: 25100, amount: 12550000,  date: daysAgo(10)  },
  ],
  // Cổ phiếu VNM
  [
    { type: 'buy',  quantity: 500,   price: 68000,  amount: 34000000, date: daysAgo(160) },
    { type: 'buy',  quantity: 300,   price: 65000,  amount: 19500000, date: daysAgo(80)  },
    { type: 'sell', quantity: 200,   price: 72000,  amount: 14400000, date: daysAgo(20)  },
  ],
];

// Holdings tương ứng (tính thủ công từ transactions trên)
// total_invested = sum(buy.amount), total_sold = sum(sell.amount)
// quantity = sum(buy.qty) - sum(sell.qty)
// average_price = (total_invested - total_sold) / quantity
const HOLDINGS = [
  // DCDS: buy 1800, sell 200 → qty=1600, invested=27930000, sold=3300000
  { quantity: 1600,  average_price: 15393.75, current_price: 16800,    total_invested: 27930000,  total_sold: 3300000  },
  // Vàng: buy 3, sell 1 → qty=2, invested=258000000, sold=92000000
  { quantity: 2,     average_price: 83000000, current_price: 93000000, total_invested: 258000000, total_sold: 92000000 },
  // USD: buy 3000, sell 500 → qty=2500, invested=72900000, sold=12550000
  { quantity: 2500,  average_price: 24140,    current_price: 25200,    total_invested: 72900000,  total_sold: 12550000 },
  // VNM: buy 800, sell 200 → qty=600, invested=53500000, sold=14400000
  { quantity: 600,   average_price: 65000,    current_price: 71500,    total_invested: 53500000,  total_sold: 14400000 },
];

// Chi tiêu hàng tháng (3 tháng gần nhất)
const EXPENSE_MONTHS = [
  {
    month: monthsAgo(2),
    items: [
      { name: 'Ăn uống',              amount: 3500000 },
      { name: 'Thuê nhà',             amount: 6000000 },
      { name: 'Điện/Nước/Internet',   amount: 850000  },
      { name: 'Di chuyển',            amount: 600000  },
      { name: 'Giải trí',             amount: 400000  },
      { name: 'Sức khỏe',             amount: 300000  },
    ],
  },
  {
    month: monthsAgo(1),
    items: [
      { name: 'Ăn uống',              amount: 3800000 },
      { name: 'Thuê nhà',             amount: 6000000 },
      { name: 'Điện/Nước/Internet',   amount: 920000  },
      { name: 'Di chuyển',            amount: 750000  },
      { name: 'Giải trí',             amount: 550000  },
      { name: 'Sức khỏe',             amount: 200000  },
      { name: 'Mua sắm',              amount: 1200000 },
    ],
  },
  {
    month: monthsAgo(0),
    items: [
      { name: 'Ăn uống',              amount: 3200000 },
      { name: 'Thuê nhà',             amount: 6000000 },
      { name: 'Điện/Nước/Internet',   amount: 870000  },
      { name: 'Di chuyển',            amount: 500000  },
      { name: 'Giải trí',             amount: 300000  },
    ],
  },
];

// Sổ tiết kiệm
const SAVINGS_BOOKS = [
  {
    name: 'Quỹ khẩn cấp',
    description: '6 tháng chi tiêu dự phòng',
    color: '#FF5722',
    transactions: [
      { type: 'deposit',    amount: 10000000, date: daysAgo(365), notes: 'Khởi tạo quỹ'        },
      { type: 'deposit',    amount: 5000000,  date: daysAgo(270), notes: 'Nạp thêm tháng 3'    },
      { type: 'interest',   amount: 420000,   date: daysAgo(180), notes: 'Lãi 6 tháng 4.2%/năm' },
      { type: 'deposit',    amount: 3000000,  date: daysAgo(90),  notes: 'Nạp thêm tháng 9'    },
      { type: 'interest',   amount: 235000,   date: daysAgo(1),   notes: 'Lãi kỳ hạn'           },
    ],
  },
  {
    name: 'Tiết kiệm mua nhà',
    description: 'Mục tiêu 5 năm',
    color: '#3F51B5',
    transactions: [
      { type: 'deposit',    amount: 20000000, date: daysAgo(300), notes: 'Tiết kiệm đầu năm'   },
      { type: 'deposit',    amount: 10000000, date: daysAgo(210), notes: 'Tháng 4'              },
      { type: 'deposit',    amount: 10000000, date: daysAgo(120), notes: 'Tháng 7'              },
      { type: 'interest',   amount: 1200000,  date: daysAgo(60),  notes: 'Lãi kỳ hạn 12 tháng' },
      { type: 'deposit',    amount: 8000000,  date: daysAgo(30),  notes: 'Tháng 11'             },
    ],
  },
];

// ─── seed ────────────────────────────────────────────────────────────────────

async function seed() {
  let conn;

  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'investment_tracker',
      ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
    });

    console.log('🔗 Connected\n');

    // ── 1. Lấy admin user ──────────────────────────────────────────────────
    const [adminRows] = await conn.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      console.error('❌ Admin user not found. Run migrate-auth.js first.');
      process.exit(1);
    }
    const userId = adminRows[0].id;
    console.log(`✓ Admin user id = ${userId}`);

    // ── 2. Categories ──────────────────────────────────────────────────────
    console.log('\n📦 Seeding categories...');
    const categoryIds = [];
    for (const cat of CATEGORIES) {
      const [existing] = await conn.query(
        'SELECT id FROM categories WHERE name = ? AND user_id = ?',
        [cat.name, userId]
      );
      if (existing.length > 0) {
        categoryIds.push(existing[0].id);
        console.log(`  ↩ "${cat.name}" already exists (id=${existing[0].id})`);
      } else {
        const [res] = await conn.query(
          'INSERT INTO categories (user_id, name, description, color) VALUES (?, ?, ?, ?)',
          [userId, cat.name, cat.description, cat.color]
        );
        categoryIds.push(res.insertId);
        console.log(`  ✓ "${cat.name}" created (id=${res.insertId})`);
      }
    }

    // ── 3. Transactions ────────────────────────────────────────────────────
    console.log('\n📦 Seeding transactions...');
    for (let i = 0; i < CATEGORIES.length; i++) {
      const catId = categoryIds[i];
      const [existingTx] = await conn.query(
        'SELECT COUNT(*) as cnt FROM transactions WHERE category_id = ?', [catId]
      );
      if (existingTx[0].cnt > 0) {
        console.log(`  ↩ "${CATEGORIES[i].name}" already has transactions, skipping`);
        continue;
      }
      for (const tx of TRANSACTIONS_BY_CATEGORY[i]) {
        await conn.query(
          `INSERT INTO transactions (category_id, type, quantity, price, amount, transaction_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [catId, tx.type, tx.quantity, tx.price, tx.amount, tx.date]
        );
      }
      console.log(`  ✓ "${CATEGORIES[i].name}" — ${TRANSACTIONS_BY_CATEGORY[i].length} transactions`);
    }

    // ── 4. Holdings ────────────────────────────────────────────────────────
    console.log('\n📦 Seeding holdings...');
    for (let i = 0; i < CATEGORIES.length; i++) {
      const catId = categoryIds[i];
      const h = HOLDINGS[i];
      const [existing] = await conn.query(
        'SELECT id FROM holdings WHERE category_id = ?', [catId]
      );
      if (existing.length > 0) {
        await conn.query(
          `UPDATE holdings SET quantity=?, average_price=?, current_price=?,
           total_invested=?, total_sold=? WHERE category_id=?`,
          [h.quantity, h.average_price, h.current_price, h.total_invested, h.total_sold, catId]
        );
        console.log(`  ↩ "${CATEGORIES[i].name}" holding updated`);
      } else {
        await conn.query(
          `INSERT INTO holdings (category_id, quantity, average_price, current_price,
           total_invested, total_sold, current_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [catId, h.quantity, h.average_price, h.current_price,
           h.total_invested, h.total_sold, h.current_price * h.quantity]
        );
        console.log(`  ✓ "${CATEGORIES[i].name}" holding created`);
      }
    }

    // ── 5. Portfolio snapshots (30 ngày gần nhất) ──────────────────────────
    console.log('\n📦 Seeding portfolio snapshots...');
    // Chỉ tạo nếu chưa có snapshot nào của user này
    const [existingSnap] = await conn.query(
      `SELECT COUNT(*) as cnt FROM portfolio_snapshots ps
       JOIN categories c ON ps.category_id = c.id WHERE c.user_id = ?`,
      [userId]
    );
    if (existingSnap[0].cnt > 0) {
      console.log('  ↩ Portfolio snapshots already exist, skipping');
    } else {
      for (let day = 29; day >= 0; day--) {
        const snapDate = daysAgo(day);
        // Mô phỏng giá biến động nhẹ theo ngày
        const factor = 1 + (Math.sin(day * 0.3) * 0.02); // ±2% dao động
        for (let i = 0; i < CATEGORIES.length; i++) {
          const catId = categoryIds[i];
          const h = HOLDINGS[i];
          const currentPrice = h.current_price * factor;
          const totalValue = currentPrice * h.quantity;
          const pnl = (totalValue + h.total_sold) - h.total_invested;
          const pnlPct = h.total_invested > 0 ? (pnl / h.total_invested * 100) : 0;
          await conn.query(
            `INSERT IGNORE INTO portfolio_snapshots
             (category_id, snapshot_date, total_value, total_invested, total_sold, pnl, pnl_percentage)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [catId, snapDate,
             totalValue.toFixed(2), h.total_invested, h.total_sold,
             pnl.toFixed(2), pnlPct.toFixed(4)]
          );
        }
      }
      console.log('  ✓ 30-day portfolio snapshots created');
    }

    // ── 6. Monthly expenses ────────────────────────────────────────────────
    console.log('\n📦 Seeding monthly expenses...');
    for (const monthData of EXPENSE_MONTHS) {
      const [existing] = await conn.query(
        'SELECT id FROM monthly_expenses WHERE month = ? AND user_id = ?',
        [monthData.month, userId]
      );
      let monthlyId;
      if (existing.length > 0) {
        monthlyId = existing[0].id;
        console.log(`  ↩ Month ${monthData.month} already exists`);
      } else {
        const total = monthData.items.reduce((s, it) => s + it.amount, 0);
        const [res] = await conn.query(
          'INSERT INTO monthly_expenses (user_id, month, total_amount) VALUES (?, ?, ?)',
          [userId, monthData.month, total]
        );
        monthlyId = res.insertId;

        for (const item of monthData.items) {
          await conn.query(
            'INSERT INTO expense_items (monthly_expense_id, name, amount) VALUES (?, ?, ?)',
            [monthlyId, item.name, item.amount]
          );
        }
        console.log(`  ✓ Month ${monthData.month} — ${monthData.items.length} items`);
      }
    }

    // ── 7. Savings books & transactions ───────────────────────────────────
    console.log('\n📦 Seeding savings books...');
    const savingsBookIds = [];
    for (const book of SAVINGS_BOOKS) {
      const [existing] = await conn.query(
        'SELECT id FROM savings_books WHERE name = ? AND user_id = ?',
        [book.name, userId]
      );
      let bookId;
      if (existing.length > 0) {
        bookId = existing[0].id;
        console.log(`  ↩ "${book.name}" already exists`);
      } else {
        const [res] = await conn.query(
          'INSERT INTO savings_books (user_id, name, description, color) VALUES (?, ?, ?, ?)',
          [userId, book.name, book.description, book.color]
        );
        bookId = res.insertId;
        for (const tx of book.transactions) {
          await conn.query(
            `INSERT INTO savings_transactions
             (savings_book_id, type, amount, transaction_date, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [bookId, tx.type, tx.amount, tx.date, tx.notes]
          );
        }
        console.log(`  ✓ "${book.name}" created — ${book.transactions.length} transactions`);
      }
      savingsBookIds.push(bookId);
    }

    // ── 8. Savings snapshots (7 ngày gần nhất) ────────────────────────────
    console.log('\n📦 Seeding savings snapshots...');
    const [existingSavSnap] = await conn.query(
      'SELECT COUNT(*) as cnt FROM savings_snapshots WHERE user_id = ?', [userId]
    );
    if (existingSavSnap[0].cnt > 0) {
      console.log('  ↩ Savings snapshots already exist, skipping');
    } else {
      // Tính tổng balance từ transactions của tất cả sổ
      const totalDeposited = SAVINGS_BOOKS.reduce((sum, b) =>
        sum + b.transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0), 0);
      const totalInterest = SAVINGS_BOOKS.reduce((sum, b) =>
        sum + b.transactions.filter(t => t.type === 'interest').reduce((s, t) => s + t.amount, 0), 0);
      const totalBalance = totalDeposited + totalInterest;

      for (let day = 6; day >= 0; day--) {
        await conn.query(
          `INSERT IGNORE INTO savings_snapshots
           (user_id, snapshot_date, total_balance, total_interest, total_deposited)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, daysAgo(day), totalBalance, totalInterest, totalDeposited]
        );
      }
      console.log('  ✓ 7-day savings snapshots created');
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('   Login: admin / admin');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seed();
