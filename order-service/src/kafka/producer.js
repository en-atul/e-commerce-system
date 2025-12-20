const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

let isConnected = false;

const connect = async () => {
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
      topic: 'order-events',
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
  }
};

process.on('SIGTERM', async () => {
  if (isConnected) {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  }
});

module.exports = { publishEvent };

