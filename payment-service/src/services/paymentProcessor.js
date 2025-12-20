const Payment = require('../models/Payment');
const { publishEvent } = require('../kafka/producer');

// Simulate payment processing (in real scenario, integrate with payment gateway)
const processPayment = async (paymentData) => {
  const { orderId, userId, amount, paymentMethod } = paymentData;

  try {
    // Create payment record
    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      paymentMethod: paymentMethod || 'CREDIT_CARD',
      status: 'PENDING'
    });

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate payment success/failure (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      await Payment.updateStatus(payment.id, 'COMPLETED');
      await publishEvent('payment-processed', {
        orderId,
        paymentId: payment.id,
        amount,
        status: 'COMPLETED'
      });
      return { success: true, payment };
    } else {
      await Payment.updateStatus(payment.id, 'FAILED');
      await publishEvent('payment-failed', {
        orderId,
        paymentId: payment.id,
        amount,
        status: 'FAILED',
        reason: 'Payment processing failed'
      });
      return { success: false, payment, error: 'Payment processing failed' };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    await publishEvent('payment-failed', {
      orderId,
      amount,
      status: 'FAILED',
      reason: error.message
    });
    throw error;
  }
};

module.exports = { processPayment };

