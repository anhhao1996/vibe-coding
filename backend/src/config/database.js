/**
 * Database Configuration
 * Knex query builder instance. All models use this via BaseModel.
 */
const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'investment_tracker',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
  },
  pool: { min: 0, max: 10 }
});

db.close = async () => {
  await db.destroy();
};

module.exports = db;
