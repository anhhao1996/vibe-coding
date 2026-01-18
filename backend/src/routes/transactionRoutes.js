/**
 * Transaction Routes
 * Single Responsibility: Define routes for transactions
 */
const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const { transactionValidators } = require('../middleware/validator');

// GET /api/transactions - Get all transactions
router.get('/', (req, res) => TransactionController.getAll(req, res));

// GET /api/transactions/recent - Get recent transactions
router.get('/recent', (req, res) => TransactionController.getRecent(req, res));

// GET /api/transactions/date-range - Get transactions by date range
router.get('/date-range', (req, res) => TransactionController.getByDateRange(req, res));

// GET /api/transactions/category/:categoryId - Get transactions by category
router.get('/category/:categoryId', (req, res) => TransactionController.getByCategory(req, res));

// POST /api/transactions - Create new transaction
router.post('/', transactionValidators.create, (req, res) => TransactionController.create(req, res));

// PUT /api/transactions/:id - Update transaction
router.put('/:id', transactionValidators.update, (req, res) => TransactionController.update(req, res));

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', (req, res) => TransactionController.delete(req, res));

module.exports = router;
