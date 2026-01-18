/**
 * Price Routes
 * External price API routes
 */
const express = require('express');
const router = express.Router();
const PriceController = require('../controllers/PriceController');

// GET /api/price/dcds - Lấy giá DCDS
router.get('/dcds', (req, res) => PriceController.getDCDSPrice(req, res));

// GET /api/price/gold - Lấy giá vàng SJC
router.get('/gold', (req, res) => PriceController.getGoldPrice(req, res));

// GET /api/price/usd - Lấy tỷ giá USD
router.get('/usd', (req, res) => PriceController.getUSDPrice(req, res));

// GET /api/price/fund/:fundCode - Lấy giá theo fund code
router.get('/fund/:fundCode', (req, res) => PriceController.getPriceByFundCode(req, res));

// POST /api/price/dcds/update/:categoryId - Cập nhật giá DCDS cho category
router.post('/dcds/update/:categoryId', (req, res) => PriceController.updateCategoryWithDCDSPrice(req, res));

// POST /api/price/gold/update/:categoryId - Cập nhật giá vàng cho category
router.post('/gold/update/:categoryId', (req, res) => PriceController.updateCategoryWithGoldPrice(req, res));

// POST /api/price/usd/update/:categoryId - Cập nhật tỷ giá USD cho category
router.post('/usd/update/:categoryId', (req, res) => PriceController.updateCategoryWithUSDPrice(req, res));

module.exports = router;
