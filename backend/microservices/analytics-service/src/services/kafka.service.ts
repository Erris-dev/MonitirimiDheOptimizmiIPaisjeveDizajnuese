import { kafka } from '../config/kafka';
import { io } from './socket.service';
import { latestHealthData } from '../cache'; // Import the cache

const consumer = kafka.consumer({ groupId: 'analytical-group' });

export const startKafka = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'processed-insights', fromBeginning: false });

   await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        // Log this to see if the message arrived!
        const rawValue = message.value.toString();
        console.log('📬 KAFKA MESSAGE RECEIVED:', rawValue);

        const parsedData = JSON.parse(rawValue);
        latestHealthData.current = parsedData; 

        if (io) {
          io.emit('NEW_HEALTH_INSIGHT', parsedData);
        }
      },
    });
  } catch (error) {
    console.error('❌ Kafka Service Error:', error);
  }
};