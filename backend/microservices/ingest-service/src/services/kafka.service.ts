import { Kafka } from "kafkajs";
import { UserMetricsEvent } from "../models/metrics";

class KafkaService {
  private kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER || "kafka:29092"] });
  private producer = this.kafka.producer();
  private topic = "metrics";

  async connect() {
    await this.producer.connect();
    console.log("Kafka connected");
  }

  /**
   * Send one or more metrics to Kafka
   */
  async sendMetrics(metrics: UserMetricsEvent | UserMetricsEvent[]) {
    // Ensure metrics is always an array
    const metricsArray = Array.isArray(metrics) ? metrics : [metrics];

    await this.producer.send({
      topic: this.topic,
      messages: metricsArray.map(m => ({ value: JSON.stringify(m) })),
    });

    console.log(`Forwarded ${metricsArray.length} metric(s) to Kafka`);
  }
}

export const kafkaService = new KafkaService();
