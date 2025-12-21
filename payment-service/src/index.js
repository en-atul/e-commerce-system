const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ConfigClient = require('@ecommerce/config-client');
const configModule = require('./config');
const paymentRoutes = require('./routes/paymentRoutes');
const { startConsumer } = require('./kafka/consumer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    const pool = configModule.getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'OK', service: 'payment-service', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', service: 'payment-service', database: 'disconnected' });
  }
});

// Routes
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Payment Service Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Ensure database exists (create if it doesn't)
const ensureDatabaseExists = async (dbConfig) => {
  const { Pool } = require('pg');
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

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const pool = configModule.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'CREDIT_CARD',
          status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query('CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');

      await client.query('COMMIT');
      console.log('Database tables initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Initialize configuration and start server
const initializeService = async () => {
  try {
    // Determine profile based on environment
    const profile = process.env.NODE_ENV === 'production' ? 'default' : 'dev';
    const serviceName = 'payment-service';
    
    // Fetch configuration from config server ONCE at startup
    const configClient = new ConfigClient();
    const config = await configClient.getConfig(serviceName, profile);
    console.log(`Configuration loaded from Config Server (profile: ${profile})`);
    
    // Store config globally
    configModule.setConfig(config);
    configModule.setConfigClient(configClient);
    
    // Ensure database exists before connecting
    await ensureDatabaseExists(config.database);
    
    // Initialize database connection with config
    const { Pool } = require('pg');
    const pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
    
    // Store pool globally
    configModule.setPool(pool);
    
    const PORT = config.server.port;
    
    // Start server
    app.listen(PORT, async () => {
      console.log(`Payment Service running on port ${PORT}`);
      await initializeDatabase();
      await startConsumer();
    });
  } catch (error) {
    console.error('Failed to initialize service:', error);
    process.exit(1);
  }
};

// Start initialization
initializeService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  const pool = configModule.getPool();
  await pool.end();
  console.log('Database connection closed');
  process.exit(0);
});

