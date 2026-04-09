/**
 * Savings Routes
 * Routes cho quản lý tiết kiệm
 */
const express = require('express');
const router = express.Router();
const SavingsController = require('../controllers/SavingsController');

// GET /api/savings - Lấy tất cả sổ tiết kiệm
router.get('/', (req, res) => SavingsController.getAll(req, res));

// GET /api/savings/:id - Lấy chi tiết sổ tiết kiệm
router.get('/:id', (req, res) => SavingsController.getById(req, res));

// POST /api/savings - Tạo sổ tiết kiệm mới
router.post('/', (req, res) => SavingsController.create(req, res));

// PUT /api/savings/:id - Cập nhật sổ tiết kiệm
router.put('/:id', (req, res) => SavingsController.update(req, res));

// DELETE /api/savings/:id - Xóa sổ tiết kiệm
router.delete('/:id', (req, res) => SavingsController.delete(req, res));

// POST /api/savings/:id/transactions - Thêm giao dịch
router.post('/:id/transactions', (req, res) => SavingsController.addTransaction(req, res));

// DELETE /api/savings/transactions/:id - Xóa giao dịch
router.delete('/transactions/:id', (req, res) => SavingsController.deleteTransaction(req, res));

module.exports = router;
