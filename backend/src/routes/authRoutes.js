/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/register', (req, res) => AuthController.register(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => AuthController.getCurrentUser(req, res));
router.post('/change-password', authMiddleware, (req, res) => AuthController.changePassword(req, res));

module.exports = router;
