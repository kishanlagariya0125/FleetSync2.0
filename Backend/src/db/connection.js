const { Pool } = require("pg");
require("dotenv").config();

const poolConfigs = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }
  : {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "fleetflow2.0",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "system",
  };

const pool = new Pool(poolConfigs);

// Simple query helper
const query = (text, params) => pool.query(text, params);

// Connection getter for transactions
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient,
};