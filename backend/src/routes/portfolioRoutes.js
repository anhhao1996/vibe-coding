/**
 * Portfolio Routes
 * Single Responsibility: Define routes for portfolio analytics
 */
const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/PortfolioController');
const { portfolioValidators } = require('../middleware/validator');

// GET /api/portfolio/dashboard - Get all dashboard data
router.get('/dashboard', (req, res) => PortfolioController.getDashboard(req, res));

// PUT /api/portfolio/price/:categoryId - Update current price (unit price)
router.put('/price/:categoryId', portfolioValidators.updatePrice, (req, res) => PortfolioController.updateCurrentPrice(req, res));

// POST /api/portfolio/snapshot - Create daily snapshot
router.post('/snapshot', (req, res) => PortfolioController.createSnapshot(req, res));

module.exports = router;
