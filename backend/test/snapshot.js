/**
 * Snapshot Testing for Model Migration
 *
 * Captures output of every model method, then verifies after refactor.
 *
 * Usage:
 *   node test/snapshot.js --capture   # Save current output as golden snapshot
 *   node test/snapshot.js --verify    # Compare current output against golden snapshot
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('../src/config/database');

const Category = require('../src/models/Category');
const Holding = require('../src/models/Holding');
const Transaction = require('../src/models/Transaction');
const PortfolioSnapshot = require('../src/models/PortfolioSnapshot');
const MonthlyExpense = require('../src/models/MonthlyExpense');
const ExpenseItem = require('../src/models/ExpenseItem');
const SavingsBook = require('../src/models/SavingsBook');
const SavingsTransaction = require('../src/models/SavingsTransaction');
const SavingsSnapshot = require('../src/models/SavingsSnapshot');
const UserSettings = require('../src/models/UserSettings');

const SNAPSHOT_FILE = path.join(__dirname, 'snapshots', 'models.json');
const TEST_USER_ID = 1;

async function captureAll() {
  const snapshot = {};

  // ── BaseModel CRUD (via Category) ──────────────────────────────────────
  snapshot['Category.findById_1'] = await Category.findById(1);
  snapshot['Category.findAllByUser'] = await Category.findAllByUser(TEST_USER_ID);
  snapshot['Category.findByName_DCDS'] = await Category.findByName('Quỹ DCDS', TEST_USER_ID);
  snapshot['Category.findWithHoldings'] = await Category.findWithHoldings(TEST_USER_ID);
  snapshot['Category.getCategoryWithDetails_1'] = await Category.getCategoryWithDetails(1, TEST_USER_ID);
  snapshot['Category.belongsToUser_1'] = await Category.belongsToUser(1, TEST_USER_ID);
  snapshot['Category.count'] = await Category.count();

  // ── Holding ────────────────────────────────────────────────────────────
  snapshot['Holding.findByCategory_1'] = await Holding.findByCategory(1);
  snapshot['Holding.getAllWithCategories'] = await Holding.getAllWithCategories(TEST_USER_ID);
  snapshot['Holding.getTotalPortfolio'] = await Holding.getTotalPortfolio(TEST_USER_ID);

  // ── Transaction ────────────────────────────────────────────────────────
  snapshot['Transaction.findAllWithCategory'] = await Transaction.findAllWithCategory(100, TEST_USER_ID);
  snapshot['Transaction.findByCategory_1'] = await Transaction.findByCategory(1, 50);
  snapshot['Transaction.getRecentTransactions'] = await Transaction.getRecentTransactions(30, TEST_USER_ID);
  snapshot['Transaction.getTotalsByCategory_1'] = await Transaction.getTotalsByCategory(1);

  // ── PortfolioSnapshot ──────────────────────────────────────────────────
  snapshot['PortfolioSnapshot.getLastNDays'] = await PortfolioSnapshot.getLastNDays(30, TEST_USER_ID);
  snapshot['PortfolioSnapshot.getPortfolioHistory'] = await PortfolioSnapshot.getPortfolioHistory(30, TEST_USER_ID);
  snapshot['PortfolioSnapshot.getPnlLast7Days'] = await PortfolioSnapshot.getPnlLast7Days(TEST_USER_ID);

  // ── MonthlyExpense ─────────────────────────────────────────────────────
  const allExpenses = await MonthlyExpense.findAll('month');
  const firstExpense = allExpenses[0] || null;
  const firstExpenseMonth = firstExpense ? firstExpense.month : null;

  if (firstExpenseMonth) {
    snapshot['MonthlyExpense.findByMonth'] = await MonthlyExpense.findByMonth(firstExpenseMonth, TEST_USER_ID);
  }
  if (firstExpense) {
    snapshot['MonthlyExpense.findWithItems'] = await MonthlyExpense.findWithItems(firstExpense.id);
  }
  snapshot['MonthlyExpense.getMonthlyTrend'] = await MonthlyExpense.getMonthlyTrend(12, TEST_USER_ID);
  snapshot['MonthlyExpense.getAllUniqueItemNames'] = await MonthlyExpense.getAllUniqueItemNames(TEST_USER_ID);

  // getMultipleItemsTrend with first 2 unique item names
  const uniqueNames = await MonthlyExpense.getAllUniqueItemNames(TEST_USER_ID);
  if (uniqueNames.length > 0) {
    const testNames = uniqueNames.slice(0, 2);
    snapshot['MonthlyExpense.getMultipleItemsTrend'] = await MonthlyExpense.getMultipleItemsTrend(testNames, 12, TEST_USER_ID);
  }

  // ── ExpenseItem ────────────────────────────────────────────────────────
  if (firstExpense) {
    snapshot['ExpenseItem.findByMonthlyExpense'] = await ExpenseItem.findByMonthlyExpense(firstExpense.id);
  }

  // ── SavingsBook ────────────────────────────────────────────────────────
  snapshot['SavingsBook.findAllByUser'] = await SavingsBook.findAllByUser(TEST_USER_ID);
  const savingsBooks = await SavingsBook.findAllByUser(TEST_USER_ID);
  if (savingsBooks.length > 0) {
    snapshot['SavingsBook.findByIdWithTransactions'] = await SavingsBook.findByIdWithTransactions(savingsBooks[0].id);
    snapshot['SavingsBook.belongsToUser'] = await SavingsBook.belongsToUser(savingsBooks[0].id, TEST_USER_ID);
    snapshot['SavingsBook.getTotalBalanceForUser'] = await SavingsBook.getTotalBalanceForUser(TEST_USER_ID);
  }

  // ── SavingsTransaction ─────────────────────────────────────────────────
  if (savingsBooks.length > 0) {
    snapshot['SavingsTransaction.findBySavingsBook'] = await SavingsTransaction.findBySavingsBook(savingsBooks[0].id);
  }

  // ── UserSettings ───────────────────────────────────────────────────────
  snapshot['UserSettings.getSetting_nonexistent'] = await UserSettings.getSetting(TEST_USER_ID, '__test_nonexistent__');

  return snapshot;
}

function normalize(obj) {
  return JSON.parse(JSON.stringify(obj, (key, val) => {
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'number') return parseFloat(val.toFixed(6));
    if (typeof val === 'bigint') return Number(val);
    return val;
  }));
}

async function main() {
  const mode = process.argv[2];

  if (mode === '--capture') {
    console.log('Capturing snapshots...\n');
    const snapshot = normalize(await captureAll());
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
    console.log(`Captured ${Object.keys(snapshot).length} snapshots --> ${SNAPSHOT_FILE}`);

  } else if (mode === '--verify') {
    if (!fs.existsSync(SNAPSHOT_FILE)) {
      console.error('No snapshot file found. Run --capture first.');
      process.exit(1);
    }

    console.log('Verifying snapshots...\n');
    const expected = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    const actual = normalize(await captureAll());

    let passed = 0, failed = 0;
    for (const [key, expectedVal] of Object.entries(expected)) {
      const actualVal = actual[key];
      const expectedStr = JSON.stringify(expectedVal);
      const actualStr = JSON.stringify(actualVal) ?? 'undefined';
      if (expectedStr === actualStr) {
        console.log(`  PASS  ${key}`);
        passed++;
      } else {
        console.log(`  FAIL  ${key}`);
        console.log(`    expected: ${String(expectedStr).slice(0, 200)}...`);
        console.log(`    actual:   ${String(actualStr).slice(0, 200)}...`);
        failed++;
      }
    }

    // Check for keys in actual that are not in expected (new methods)
    for (const key of Object.keys(actual)) {
      if (!(key in expected)) {
        console.log(`  NEW   ${key} (not in snapshot)`);
      }
    }

    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);

  } else {
    console.log('Usage: node test/snapshot.js --capture | --verify');
    process.exit(1);
  }

  if (db.close) await db.close();
  else if (db.destroy) await db.destroy();
  else if (db.end) await db.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
