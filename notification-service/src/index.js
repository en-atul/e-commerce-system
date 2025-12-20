const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { startConsumer } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  await startConsumer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Notification service shutting down');
  process.exit(0);
});

