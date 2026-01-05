import { Kafka } from "kafkajs";
import { Metric } from "../models/metrics";

class KafkaService {
  private kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER || "localhost:9092"] });
  private producer = this.kafka.producer();
  private topic = "metrics";

  async connect() {
    await this.producer.connect();
    console.log("Kafka connected");
  }

  async sendMetrics(metrics: Metric[]) {
    await this.producer.send({
      topic: this.topic,
      messages: metrics.map(m => ({ value: JSON.stringify(m) })),
    });
    console.log(`Forwarded ${metrics.length} metrics to Kafka`);
  }
}

export const kafkaService = new KafkaService();
