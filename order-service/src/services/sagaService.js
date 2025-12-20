const axios = require('axios');
const { publishEvent } = require('../kafka/producer');
const Order = require('../models/Order');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';

// SAGA Choreography - Order Service publishes events and listens to responses
const createOrderSaga = async (orderData) => {
  const { userId, items, totalAmount } = orderData;
  
  try {
    // Step 1: Create order with PENDING status
    const order = await Order.create({
      userId,
      items,
      totalAmount
    });

    // Step 2: Publish OrderCreated event - triggers product reservation
    await publishEvent('order-created', {
      orderId: order.id,
      userId,
      items,
      totalAmount
    });

    return order;
  } catch (error) {
    console.error('Error creating order saga:', error);
    throw error;
  }
};

// Handle product reservation success
const handleProductReserved = async (eventData) => {
  const { orderId, items } = eventData;
  
  try {
    // Publish OrderProductsReserved event - triggers payment processing
    await publishEvent('order-products-reserved', {
      orderId,
      items
    });
  } catch (error) {
    console.error('Error handling product reserved:', error);
    // Trigger compensation
    await handleOrderFailure(orderId, 'PRODUCT_RESERVATION_FAILED');
  }
};

// Handle product reservation failure
const handleProductReservationFailed = async (eventData) => {
  const { orderId, reason } = eventData;
  await handleOrderFailure(orderId, reason || 'PRODUCT_RESERVATION_FAILED');
};

// Handle payment success
const handlePaymentProcessed = async (eventData) => {
  const { orderId } = eventData;
  
  try {
    // Update order status to CONFIRMED
    await Order.updateStatus(orderId, 'CONFIRMED');
    
    // Publish OrderConfirmed event
    await publishEvent('order-confirmed', {
      orderId
    });
  } catch (error) {
    console.error('Error handling payment processed:', error);
  }
};

// Handle payment failure
const handlePaymentFailed = async (eventData) => {
  const { orderId, items } = eventData;
  
  try {
    // Trigger compensation - release reserved products
    await publishEvent('order-payment-failed', {
      orderId,
      items
    });
    
    // Update order status to FAILED
    await Order.updateStatus(orderId, 'FAILED');
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

// Handle product stock released (compensation)
const handleProductStockReleased = async (eventData) => {
  const { orderId } = eventData;
  await Order.updateStatus(orderId, 'CANCELLED');
};

// General failure handler
const handleOrderFailure = async (orderId, reason) => {
  try {
    await Order.updateStatus(orderId, 'FAILED');
    await publishEvent('order-failed', {
      orderId,
      reason
    });
  } catch (error) {
    console.error('Error handling order failure:', error);
  }
};

module.exports = {
  createOrderSaga,
  handleProductReserved,
  handleProductReservationFailed,
  handlePaymentProcessed,
  handlePaymentFailed,
  handleProductStockReleased,
  handleOrderFailure
};

