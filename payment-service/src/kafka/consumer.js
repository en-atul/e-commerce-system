const { Kafka } = require('kafkajs');
const { processPayment } = require('../services/paymentProcessor');

const kafka = new Kafka({
  clientId: 'payment-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'payment-service-group' });

const startConsumer = async () => {
  await consumer.connect();
  console.log('Kafka consumer connected');

  // Subscribe to order events
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const { eventType, data } = event;

        console.log(`Received event: ${eventType} from topic: ${topic}`);

        // Handle order-products-reserved event - trigger payment processing
        if (eventType === 'order-products-reserved') {
          const { orderId, userId, totalAmount } = data;
          
          await processPayment({
            orderId,
            userId,
            amount: totalAmount,
            paymentMethod: 'CREDIT_CARD'
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
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

