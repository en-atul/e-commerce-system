/**
 * Shared Database Utilities
 * Reusable database initialization functions for all services
 */

const { Pool } = require('pg');

/**
 * Ensure database exists (create if it doesn't)
 * @param {Object} dbConfig - Database configuration object
 * @returns {Promise<void>}
 */
const ensureDatabaseExists = async (dbConfig) => {
  // Connect to default 'postgres' database to check/create target database
  const adminPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres', // Connect to default database
    user: dbConfig.user,
    password: dbConfig.password,
  });

  try {
    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.name]
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`Database '${dbConfig.name}' does not exist. Creating...`);
      await adminPool.query(`CREATE DATABASE ${dbConfig.name}`);
      console.log(`Database '${dbConfig.name}' created successfully`);
    } else {
      console.log(`Database '${dbConfig.name}' already exists`);
    }
  } catch (error) {
    console.error(`Error ensuring database exists: ${error.message}`);
    // Don't throw - let the connection attempt happen anyway
  } finally {
    await adminPool.end();
  }
};

/**
 * Create a database connection pool from config
 * @param {Object} dbConfig - Database configuration object
 * @returns {Pool} PostgreSQL connection pool
 */
const createPool = (dbConfig) => {
  const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.name,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
};

module.exports = {
  ensureDatabaseExists,
  createPool
};

