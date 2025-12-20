const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'api-gateway' });
});

// Public routes (no authentication)
app.use('/api/auth', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

// Protected routes (require authentication)
// User Service
app.use('/api/users', authenticateToken, createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

// Product Service
app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products'
  }
}));

// Admin-only product routes
app.use('/api/admin/products', authenticateToken, requireRole(['ADMIN']), createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin/products': '/api/products'
  }
}));

// Order Service
app.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

// Payment Service
app.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

