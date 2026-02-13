import { Kafka, LogEntry, logLevel } from 'kafkajs';

const BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

// Custom logger to keep the console clean
const customLogger = () => ({ level, log }: LogEntry) => {
  const { message, ...extra } = log;
  console.log(`[Kafka] ${message}`);
};

export const kafka = new Kafka({
  clientId: 'analytical-service',
  brokers: BROKERS,
  logLevel: logLevel.NOTHING,
  logCreator: customLogger,
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
})