/**
 * Expense Routes
 * Routes cho quản lý chi tiêu
 */
const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/ExpenseController');

// GET /api/expenses - Lấy tất cả chi tiêu hàng tháng
router.get('/', (req, res) => ExpenseController.getAll(req, res));

// GET /api/expenses/trend - Lấy xu hướng chi tiêu
router.get('/trend', (req, res) => ExpenseController.getTrend(req, res));

// GET /api/expenses/item-names - Lấy danh sách tên khoản chi tiêu unique
router.get('/item-names', (req, res) => ExpenseController.getUniqueItemNames(req, res));

// GET /api/expenses/tracked-items - Lấy danh sách tracked items của user
router.get('/tracked-items', (req, res) => ExpenseController.getTrackedItems(req, res));

// PUT /api/expenses/tracked-items - Lưu danh sách tracked items của user
router.put('/tracked-items', (req, res) => ExpenseController.saveTrackedItems(req, res));

// GET /api/expenses/trend/item/:itemName - Lấy xu hướng theo tên khoản chi
router.get('/trend/item/:itemName', (req, res) => ExpenseController.getItemTrend(req, res));

// POST /api/expenses/trend/items - Lấy xu hướng nhiều khoản chi
router.post('/trend/items', (req, res) => ExpenseController.getMultipleItemsTrend(req, res));

// GET /api/expenses/month/:month - Lấy chi tiêu theo tháng
router.get('/month/:month', (req, res) => ExpenseController.getByMonth(req, res));

// GET /api/expenses/:id - Lấy chi tiêu theo ID
router.get('/:id', (req, res) => ExpenseController.getById(req, res));

// POST /api/expenses - Tạo chi tiêu tháng mới
router.post('/', (req, res) => ExpenseController.createMonth(req, res));

// POST /api/expenses/:monthlyExpenseId/items - Thêm khoản chi tiêu
router.post('/:monthlyExpenseId/items', (req, res) => ExpenseController.addItem(req, res));

// POST /api/expenses/copy - Copy từ tháng trước
router.post('/copy', (req, res) => ExpenseController.copyFromMonth(req, res));

// PUT /api/expenses/items/:id - Cập nhật khoản chi tiêu
router.put('/items/:id', (req, res) => ExpenseController.updateItem(req, res));

// DELETE /api/expenses/items/:id - Xóa khoản chi tiêu
router.delete('/items/:id', (req, res) => ExpenseController.deleteItem(req, res));

// DELETE /api/expenses/month/:month - Xóa toàn bộ chi tiêu tháng
router.delete('/month/:month', (req, res) => ExpenseController.deleteMonth(req, res));

module.exports = router;
