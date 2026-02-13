import { kafka } from '../config/kafka';
import { io } from './socket.service';
import { latestHealthData } from '../cache';

const consumer = kafka.consumer({ groupId: 'analytical-group' });

export const startKafka = async () => {
  try {
    await consumer.connect();
    console.log('✅ Analytical Service: Kafka Connected');
    await consumer.subscribe({ topic: 'processed-insights', fromBeginning: false });
    console.log('📡 Subscribed to topic: processed-insights');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        try {
          const parsedData = JSON.parse(message.value.toString());
          
          // 📝 ADDED: LOG ARRIVAL
          console.log(`📬 DATA RECEIVED FROM KAFKA [Topic: ${topic}]`);
          console.log(`📊 Insight Payload:`, JSON.stringify(parsedData, null, 2));

          // Store in cache for the AI route
          latestHealthData.current = parsedData;

          const targetUser = parsedData.userId; 

          if (io) {
            console.log(`🎯 TARGETED EMIT: Sending result to Room [${targetUser}]`);
            io.emit('NEW_HEALTH_INSIGHT', parsedData);
          } else if (!targetUser) {
            console.warn('⚠️ WARNING: Received Kafka message but no userId found in payload.');
            // Optional: Broadcast to everyone if no specific user is found
            // io.emit('NEW_HEALTH_INSIGHT', parsedData);
          }
        } catch (parseError) {
          console.error('❌ Error parsing Kafka message value:', parseError);
        }
      },
    });
  } catch (error) {
    console.error('❌ Kafka Service Error:', error);
  }
};