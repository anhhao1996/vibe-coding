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

// POST /api/transactions - Create new transaction
router.post('/', transactionValidators.create, (req, res) => TransactionController.create(req, res));

// PUT /api/transactions/:id - Update transaction
router.put('/:id', transactionValidators.update, (req, res) => TransactionController.update(req, res));

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', (req, res) => TransactionController.delete(req, res));

module.exports = router;
