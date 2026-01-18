/**
 * Category Routes
 * Single Responsibility: Define routes for categories
 */
const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { categoryValidators } = require('../middleware/validator');

// GET /api/categories - Get all categories
router.get('/', (req, res) => CategoryController.getAll(req, res));

// GET /api/categories/:id - Get category by ID
router.get('/:id', categoryValidators.getById, (req, res) => CategoryController.getById(req, res));

// POST /api/categories - Create new category
router.post('/', categoryValidators.create, (req, res) => CategoryController.create(req, res));

// PUT /api/categories/:id - Update category
router.put('/:id', categoryValidators.update, (req, res) => CategoryController.update(req, res));

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryValidators.getById, (req, res) => CategoryController.delete(req, res));

module.exports = router;
