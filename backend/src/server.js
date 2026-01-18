/**
 * Express Server Entry Point
 * Single Responsibility: Initialize and configure server
 */
const express = require('express');
const cors = require('cors');
const appConfig = require('./config/app');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
