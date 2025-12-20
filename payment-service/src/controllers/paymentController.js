const Payment = require('../models/Payment');

const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findByOrderId(orderId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for this order' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment by order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const payments = await Payment.findByUserId(userId, limit, offset);
    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getPayment,
  getPaymentByOrderId,
  getUserPayments
};

