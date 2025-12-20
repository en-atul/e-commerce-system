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

// IMPORTANT: Do NOT use app.use(express.json()) globally!
// The body parser consumes the request stream, preventing proxy middleware from reading it.
// This causes POST requests to hang because the proxy waits for a body that was already consumed.
// Proxy middleware will stream the body directly without parsing.

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

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

// Determine service URLs - use localhost in development, Docker service names in production
// Default to development if NODE_ENV is not set or is empty
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === '';

// Public routes (no authentication)
const userServiceUrl = process.env.USER_SERVICE_URL || (isDevelopment ? 'http://localhost:3001' : 'http://user-service:3001');
console.log(`API Gateway: Environment: ${process.env.NODE_ENV || 'not set (defaulting to development)'}, User Service URL: ${userServiceUrl}`);

// Apply rate limiting to auth routes
app.use('/api/auth', limiter);

// Auth routes - use proxy middleware (works in both dev and prod now that body parser is fixed)
app.use('/api/auth', createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  timeout: 10000,
  proxyTimeout: 10000,
  agent: false, // Disable keep-alive to avoid connection pooling issues
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  logLevel: 'info', // Enable logging for debugging
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Service unavailable',
        message: err.message,
        target: userServiceUrl
      });
    }
  }
}));

// Protected routes (require authentication)
// User Service (NO body parser - proxy streams body directly)
app.use('/api/users', authenticateToken, createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  agent: false, // Disable keep-alive for production
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

// Product Service (NO body parser - proxy streams body directly)
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || (isDevelopment ? 'http://localhost:3002' : 'http://product-service:3002');
app.use('/api/products', createProxyMiddleware({
  target: productServiceUrl,
  changeOrigin: true,
  agent: false, // Disable keep-alive for production
  pathRewrite: {
    '^/api/products': '/api/products'
  }
}));

// Admin-only product routes (NO body parser - proxy streams body directly)
app.use('/api/admin/products', authenticateToken, requireRole(['ADMIN']), createProxyMiddleware({
  target: productServiceUrl,
  changeOrigin: true,
  agent: false, // Disable keep-alive for production
  pathRewrite: {
    '^/api/admin/products': '/api/products'
  }
}));

// Order Service (NO body parser - proxy streams body directly)
const orderServiceUrl = process.env.ORDER_SERVICE_URL || (isDevelopment ? 'http://localhost:3003' : 'http://order-service:3003');
app.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: orderServiceUrl,
  changeOrigin: true,
  agent: false, // Disable keep-alive for production
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

// Payment Service (NO body parser - proxy streams body directly)
const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || (isDevelopment ? 'http://localhost:3004' : 'http://payment-service:3004');
app.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: paymentServiceUrl,
  changeOrigin: true,
  agent: false, // Disable keep-alive for production
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

