/**
 * Main Router
 * Single Responsibility: Aggregate all routes
 */
const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware/auth');
const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const transactionRoutes = require('./transactionRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const priceRoutes = require('./priceRoutes');
const expenseRoutes = require('./expenseRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
router.use('/auth', authRoutes);

// Protected routes - require authentication
router.use('/categories', authMiddleware, categoryRoutes);
router.use('/transactions', authMiddleware, transactionRoutes);
router.use('/portfolio', authMiddleware, portfolioRoutes);
router.use('/price', authMiddleware, priceRoutes);
router.use('/expenses', authMiddleware, expenseRoutes);

module.exports = router;
