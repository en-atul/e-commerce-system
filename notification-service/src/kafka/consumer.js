const { Kafka } = require('kafkajs');
const notificationService = require('../services/notificationService');

const kafka = new Kafka({
  clientId: 'notification-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-service-group' });

const startConsumer = async () => {
  await consumer.connect();
  console.log('Kafka consumer connected');

  // Subscribe to all event topics
  await consumer.subscribe({ topic: 'user-events', fromBeginning: false });
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });
  await consumer.subscribe({ topic: 'payment-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const { eventType, data } = event;

        console.log(`Received event: ${eventType} from topic: ${topic}`);

        // Handle user events
        if (topic === 'user-events') {
          if (eventType === 'user-created') {
            await notificationService.handleUserCreated(data);
          }
        }

        // Handle order events
        if (topic === 'order-events') {
          if (eventType === 'order-created') {
            await notificationService.handleOrderCreated(data);
          } else if (eventType === 'order-confirmed') {
            await notificationService.handleOrderConfirmed(data);
          } else if (eventType === 'order-failed') {
            await notificationService.handleOrderFailed(data);
          }
        }

        // Handle payment events
        if (topic === 'payment-events') {
          if (eventType === 'payment-processed') {
            await notificationService.handlePaymentProcessed(data);
          } else if (eventType === 'payment-failed') {
            await notificationService.handlePaymentFailed(data);
          }
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await consumer.disconnect();
  console.log('Kafka consumer disconnected');
});

module.exports = { startConsumer };

