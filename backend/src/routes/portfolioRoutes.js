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

// GET /api/portfolio/overview - Get portfolio overview
router.get('/overview', (req, res) => PortfolioController.getOverview(req, res));

// GET /api/portfolio/distribution - Get portfolio distribution
router.get('/distribution', (req, res) => PortfolioController.getDistribution(req, res));

// GET /api/portfolio/pnl - Get PnL by category
router.get('/pnl', (req, res) => PortfolioController.getPnlByCategory(req, res));

// GET /api/portfolio/pnl-7days - Get PnL last 7 days
router.get('/pnl-7days', (req, res) => PortfolioController.getPnl7Days(req, res));

// GET /api/portfolio/history - Get portfolio history
router.get('/history', (req, res) => PortfolioController.getHistory(req, res));

// PUT /api/portfolio/value/:categoryId - Update current value
router.put('/value/:categoryId', portfolioValidators.updateValue, (req, res) => PortfolioController.updateCurrentValue(req, res));

// POST /api/portfolio/snapshot - Create daily snapshot
router.post('/snapshot', (req, res) => PortfolioController.createSnapshot(req, res));

module.exports = router;
