/**
 * Validation Middleware
 * Single Responsibility: Validate request data
 */
const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Category validators
const categoryValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
    handleValidation
  ],
  update: [
    param('id').isInt().withMessage('Invalid category ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
    handleValidation
  ],
  getById: [
    param('id').isInt().withMessage('Invalid category ID'),
    handleValidation
  ]
};

// Transaction validators
const transactionValidators = {
  create: [
    body('category_id')
      .notEmpty().withMessage('Category ID is required')
      .isInt().withMessage('Category ID must be an integer'),
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(['buy', 'sell']).withMessage('Type must be either "buy" or "sell"'),
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
    body('transaction_date')
      .optional()
      .isDate().withMessage('Invalid date format'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    handleValidation
  ],
  update: [
    param('id').isInt().withMessage('Invalid transaction ID'),
    body('category_id')
      .optional()
      .isInt().withMessage('Category ID must be an integer'),
    body('type')
      .optional()
      .isIn(['buy', 'sell']).withMessage('Type must be either "buy" or "sell"'),
    body('quantity')
      .optional()
      .isFloat({ min: 0.000001 }).withMessage('Quantity must be greater than 0'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    handleValidation
  ]
};

// Portfolio validators
const portfolioValidators = {
  updateValue: [
    param('categoryId').isInt().withMessage('Invalid category ID'),
    body('current_value')
      .notEmpty().withMessage('Current value is required')
      .isFloat({ min: 0 }).withMessage('Current value must be non-negative'),
    handleValidation
  ]
};

module.exports = {
  categoryValidators,
  transactionValidators,
  portfolioValidators
};
