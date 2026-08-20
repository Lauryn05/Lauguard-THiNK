// db.js
const { Pool } = require('pg');
require('dotenv').config();

const getPassword = () => {
  const pw = process.env.DB_PASSWORD;
  return typeof pw === 'string' ? pw : '';
};

const isInternal = process.env.USE_INTERNAL === 'true' || !process.env.USE_EXTERNAL;

const poolConfig = {
  host: isInternal
    ? process.env.DB_HOST_INTERNAL
    : process.env.DB_HOST_EXTERNAL,
  port: isInternal
    ? parseInt(process.env.DB_PORT_INTERNAL || '5432', 10)
    : parseInt(process.env.DB_PORT_EXTERNAL || '5450', 10),
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: getPassword(),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
};

const pool = new Pool(poolConfig);

// Silently test connection (no logs unless error)
pool.connect((err, client, release) => {
  if (err) console.error('DB connection error:', err.message);
  else release();
});

module.exports = pool;