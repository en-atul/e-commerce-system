const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ConfigClient = require('@ecommerce/config-client');
const configModule = require('@ecommerce/service-config');
const { ensureDatabaseExists, createPool } = require('@ecommerce/db-utils');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    const pool = configModule.getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'OK', service: 'user-service', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', service: 'user-service', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('User Service Error:', err);
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

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

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
    const serviceName = 'user-service';
    
    // Fetch configuration from config server ONCE at startup
    // This reduces config-server load and provides fast in-memory access
    const configClient = new ConfigClient();
    const config = await configClient.getConfig(serviceName, profile);
    console.log(`Configuration loaded from Config Server (profile: ${profile})`);
    
    // Store config globally (in-memory, no more requests needed)
    configModule.setConfig(config);
    configModule.setConfigClient(configClient); // Store client for optional refresh
    
    // Ensure database exists before connecting (shared utility)
    await ensureDatabaseExists(config.database);
    
    // Create database pool (shared utility)
    const pool = createPool(config.database);
    
    // Store pool globally
    configModule.setPool(pool);
    
    const PORT = config.server.port;
    
    // Start server
    app.listen(PORT, async () => {
      console.log(`User Service running on port ${PORT}`);
      await initializeDatabase();
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
  await pool.end();
  console.log('Database connection closed');
  process.exit(0);
});

