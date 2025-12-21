const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ConfigClient = require('@ecommerce/config-client');
const configModule = require('./config');
const productRoutes = require('./routes/productRoutes');
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
    res.json({ status: 'OK', service: 'product-service', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', service: 'product-service', database: 'disconnected' });
  }
});

// Routes
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Product Service Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const pool = configModule.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          category VARCHAR(100) DEFAULT 'GENERAL',
          image_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)');

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
    const serviceName = 'product-service';
    
    // Fetch configuration from config server ONCE at startup
    const configClient = new ConfigClient();
    const config = await configClient.getConfig(serviceName, profile);
    console.log(`Configuration loaded from Config Server (profile: ${profile})`);
    
    // Store config globally
    configModule.setConfig(config);
    configModule.setConfigClient(configClient);
    
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
      console.log(`Product Service running on port ${PORT}`);
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

