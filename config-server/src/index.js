const express = require('express');
const cors = require('cors');
require('dotenv').config();

const configRoutes = require('./routes/configRoutes');
const configService = require('./services/configService');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'config-server' });
});

// Actuator endpoint (Spring Boot style)
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Routes
app.use('/api/config', configRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Config Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      services: '/api/config/services',
      config: '/api/config/{serviceName}/{profile}',
      profiles: '/api/config/{serviceName}/profiles'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Config Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize default configurations on startup
const initialize = async () => {
  try {
    await configService.initializeDefaultConfigs();
    console.log('Configuration files initialized');
  } catch (error) {
    console.error('Error initializing configs:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Config Server running on port ${PORT}`);
  await initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Config Server shutting down');
  process.exit(0);
});

