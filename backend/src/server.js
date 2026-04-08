/**
 * Express Server Entry Point
 * Single Responsibility: Initialize and configure server
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const appConfig = require('./config/app');
const routes = require('./routes');

const app = express();

// Security headers
app.use(helmet());

// Rate limiting - general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

// Middleware
app.use(cors(appConfig.cors));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request logging (development)
if (appConfig.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: appConfig.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(appConfig.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Investment Tracker API Server                   ║
║   Running on: http://localhost:${appConfig.port}              ║
║   Environment: ${appConfig.nodeEnv.padEnd(11)}                    ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
