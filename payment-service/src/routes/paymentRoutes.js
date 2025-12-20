const express = require('express');
const router = express.Router();
const { getPayment, getPaymentByOrderId, getUserPayments } = require('../controllers/paymentController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to extract user from JWT (passed from API Gateway)
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

router.get('/order/:orderId', authenticateToken, getPaymentByOrderId);
router.get('/my-payments', authenticateToken, getUserPayments);
router.get('/:id', authenticateToken, getPayment);

module.exports = router;

