/**
 * Application Configuration
 * Single Responsibility: Centralized app configuration
 */
require('dotenv').config();

// Parse CORS origins (comma-separated in env)
const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return origins.split(',').map(o => o.trim());
};

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
};
