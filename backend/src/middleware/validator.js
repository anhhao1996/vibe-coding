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
  updatePrice: [
    param('categoryId').isInt().withMessage('Invalid category ID'),
    body('current_price')
      .notEmpty().withMessage('Current price is required')
      .isFloat({ min: 0 }).withMessage('Current price must be non-negative'),
    handleValidation
  ]
};

// Auth validators
const authValidators = {
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username là bắt buộc')
      .isLength({ min: 3, max: 50 }).withMessage('Username phải từ 3 đến 50 ký tự'),
    body('password')
      .notEmpty().withMessage('Password là bắt buộc'),
    handleValidation
  ],
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username là bắt buộc')
      .isLength({ min: 3, max: 50 }).withMessage('Username phải từ 3 đến 50 ký tự')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
    body('password')
      .notEmpty().withMessage('Password là bắt buộc')
      .isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
    body('display_name')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Display name tối đa 100 ký tự'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Email không hợp lệ'),
    handleValidation
  ],
  changePassword: [
    body('current_password')
      .notEmpty().withMessage('Current password là bắt buộc'),
    body('new_password')
      .notEmpty().withMessage('New password là bắt buộc')
      .isLength({ min: 6 }).withMessage('Password mới phải có ít nhất 6 ký tự'),
    handleValidation
  ]
};

module.exports = {
  categoryValidators,
  transactionValidators,
  portfolioValidators,
  authValidators
};
