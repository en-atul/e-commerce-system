const { Kafka } = require('kafkajs');
const sagaService = require('../services/sagaService');

const kafka = new Kafka({
  clientId: 'order-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'order-service-group' });

const startConsumer = async () => {
  await consumer.connect();
  console.log('Kafka consumer connected');

  // Subscribe to relevant topics
  await consumer.subscribe({ topic: 'product-events', fromBeginning: false });
  await consumer.subscribe({ topic: 'payment-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        const { eventType, data } = event;

        console.log(`Received event: ${eventType} from topic: ${topic}`);

        // Handle events from product service
        if (topic === 'product-events') {
          if (eventType === 'product-reserved') {
            await sagaService.handleProductReserved(data);
          } else if (eventType === 'product-reservation-failed') {
            await sagaService.handleProductReservationFailed(data);
          } else if (eventType === 'product-stock-released') {
            await sagaService.handleProductStockReleased(data);
          }
        }

        // Handle events from payment service
        if (topic === 'payment-events') {
          if (eventType === 'payment-processed') {
            await sagaService.handlePaymentProcessed(data);
          } else if (eventType === 'payment-failed') {
            await sagaService.handlePaymentFailed(data);
          }
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

