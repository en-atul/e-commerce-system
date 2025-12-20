// Notification service - handles all types of notifications
// In production, this would integrate with email, SMS, push notification services

const sendEmail = async (to, subject, body) => {
  // Simulate email sending
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL BODY] ${body}`);
  // In production: integrate with SendGrid, AWS SES, etc.
};

const sendSMS = async (to, message) => {
  // Simulate SMS sending
  console.log(`[SMS] To: ${to}, Message: ${message}`);
  // In production: integrate with Twilio, AWS SNS, etc.
};

const sendPushNotification = async (userId, title, body) => {
  // Simulate push notification
  console.log(`[PUSH] User: ${userId}, Title: ${title}, Body: ${body}`);
  // In production: integrate with FCM, APNS, etc.
};

const handleUserCreated = async (eventData) => {
  const { userId, email } = eventData;
  await sendEmail(
    email,
    'Welcome to E-Commerce Platform',
    `Welcome! Your account has been created successfully. User ID: ${userId}`
  );
};

const handleOrderCreated = async (eventData) => {
  const { orderId, userId } = eventData;
  await sendEmail(
    `user-${userId}@example.com`, // In production, fetch from user service
    'Order Confirmation',
    `Your order #${orderId} has been received and is being processed.`
  );
  await sendPushNotification(
    userId,
    'Order Received',
    `Your order #${orderId} has been received.`
  );
};

const handleOrderConfirmed = async (eventData) => {
  const { orderId, userId } = eventData;
  await sendEmail(
    `user-${userId}@example.com`,
    'Order Confirmed',
    `Your order #${orderId} has been confirmed and will be shipped soon.`
  );
  await sendPushNotification(
    userId,
    'Order Confirmed',
    `Your order #${orderId} has been confirmed.`
  );
};

const handleOrderFailed = async (eventData) => {
  const { orderId, userId, reason } = eventData;
  await sendEmail(
    `user-${userId}@example.com`,
    'Order Failed',
    `Unfortunately, your order #${orderId} could not be processed. Reason: ${reason}`
  );
  await sendPushNotification(
    userId,
    'Order Failed',
    `Your order #${orderId} could not be processed.`
  );
};

const handlePaymentProcessed = async (eventData) => {
  const { orderId, amount } = eventData;
  console.log(`[NOTIFICATION] Payment processed for order ${orderId}, amount: $${amount}`);
  // Send payment confirmation email
};

const handlePaymentFailed = async (eventData) => {
  const { orderId, reason } = eventData;
  console.log(`[NOTIFICATION] Payment failed for order ${orderId}, reason: ${reason}`);
  // Send payment failure notification
};

module.exports = {
  handleUserCreated,
  handleOrderCreated,
  handleOrderConfirmed,
  handleOrderFailed,
  handlePaymentProcessed,
  handlePaymentFailed
};

