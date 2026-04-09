/**
 * Price Routes
 * External price API routes
 */
const express = require('express');
const router = express.Router();
const PriceController = require('../controllers/PriceController');

// POST /api/price/fmarket/update/:categoryId — body/query slug (mặc định dcds)
router.post('/fmarket/update/:categoryId', (req, res) =>
  PriceController.updateCategoryWithFmarketPrice(req, res)
);

// POST /api/price/gold/update/:categoryId - Cập nhật giá vàng cho category
router.post('/gold/update/:categoryId', (req, res) => PriceController.updateCategoryWithGoldPrice(req, res));

// POST /api/price/usd/update/:categoryId - Cập nhật tỷ giá USD cho category
router.post('/usd/update/:categoryId', (req, res) => PriceController.updateCategoryWithUSDPrice(req, res));

module.exports = router;
