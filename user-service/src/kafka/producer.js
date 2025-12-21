const { Kafka } = require('kafkajs');
const config = require('@ecommerce/service-config');

// Initialize Kafka with config (will be set after config is loaded)
let kafka = null;
let producer = null;

let isConnected = false;

const initializeKafka = () => {
  if (!kafka) {
    const configData = config.getConfig();
    kafka = new Kafka({
      clientId: 'user-service',
      brokers: [configData.kafka.broker]
    });
    producer = kafka.producer();
  }
};

const connect = async () => {
  if (!producer) {
    initializeKafka();
  }
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected');
  }
};

const publishEvent = async (eventType, data) => {
  try {
    await connect();
    await producer.send({
      topic: 'user-events',
      messages: [
        {
          key: eventType,
          value: JSON.stringify({
            eventType,
            data,
            timestamp: new Date().toISOString()
          })
        }
      ]
    });
    console.log(`Published event: ${eventType}`);
  } catch (error) {
    console.error('Error publishing event:', error);
    // Don't throw - event publishing failures shouldn't break the main flow
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  }
});

module.exports = { publishEvent };

