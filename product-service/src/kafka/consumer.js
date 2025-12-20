const { Kafka } = require('kafkajs');
const Product = require('../models/Product');
const { publishEvent } = require('./producer');

const kafka = new Kafka({
  clientId: 'product-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'product-service-group' });

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

        // Handle order-created event - reserve products
        if (eventType === 'order-created') {
          const { orderId, items } = data;
          const reservedItems = [];
          const failedItems = [];

          // Try to reserve stock for each item
          for (const item of items) {
            try {
              const product = await Product.reserveStock(item.productId, item.quantity);
              reservedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              });
            } catch (error) {
              console.error(`Failed to reserve product ${item.productId}:`, error.message);
              failedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                reason: error.message
              });
            }
          }

          if (failedItems.length === 0) {
            // All products reserved successfully
            await publishEvent('product-reserved', {
              orderId,
              items: reservedItems
            });
          } else {
            // Some or all products failed to reserve - trigger compensation
            // Release any successfully reserved products
            for (const reservedItem of reservedItems) {
              try {
                await Product.updateStock(reservedItem.productId, reservedItem.quantity);
              } catch (error) {
                console.error(`Failed to release stock for product ${reservedItem.productId}:`, error);
              }
            }

            await publishEvent('product-reservation-failed', {
              orderId,
              failedItems,
              reason: 'Insufficient stock or product not found'
            });
          }
        }

        // Handle order-payment-failed event - release reserved stock
        if (eventType === 'order-payment-failed') {
          const { orderId, items } = data;
          
          for (const item of items) {
            try {
              await Product.updateStock(item.productId, item.quantity);
              console.log(`Released stock for product ${item.productId}`);
            } catch (error) {
              console.error(`Failed to release stock for product ${item.productId}:`, error);
            }
          }

          await publishEvent('product-stock-released', {
            orderId,
            items
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

