const express = require('express');
const cors = require('cors');
const pool = require('./db/connection');
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');
const { startConsumer } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
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

// Initialize database tables
const initializeDatabase = async () => {
  try {
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

// Start server
app.listen(PORT, async () => {
  console.log(`Payment Service running on port ${PORT}`);
  await initializeDatabase();
  await startConsumer();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  console.log('Database connection closed');
  process.exit(0);
});

