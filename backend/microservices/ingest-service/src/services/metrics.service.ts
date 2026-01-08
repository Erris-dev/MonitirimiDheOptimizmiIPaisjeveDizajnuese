// services/metrics.service.ts
import { UserMetricsEvent } from "../models/metrics";
import { kafkaService } from "./kafka.service";

export class MetricsService {
  private metricsStore: UserMetricsEvent[] = [];

  // Accept a single metric object instead of an array
  async storeAndForward(metric: UserMetricsEvent, userId?: string) {
    const metricWithUser = { ...metric, userId };

    // Store
    this.metricsStore.push(metricWithUser);

    // Forward to Kafka as a single-element array
    await kafkaService.sendMetrics([metricWithUser]);
  }

  async getAll(): Promise<UserMetricsEvent[]> {
    return this.metricsStore;
  }
}

export const metricsService = new MetricsService();
