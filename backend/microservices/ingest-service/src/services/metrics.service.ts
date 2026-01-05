import { Metric } from "../models/metrics";
import { kafkaService } from "./kafka.service";

export class MetricsService {
  private metricsStore: Metric[] = []; 

  async storeAndForward(metrics: Metric[], userId?: string) {
    // attach userId if provided
    const metricsWithUser = metrics.map(m => ({ ...m, userId }));

    // store metrics
    metricsWithUser.forEach(m => this.metricsStore.push(m));

    // forward to Kafka
    await kafkaService.sendMetrics(metricsWithUser);
  }

  async getAll(): Promise<Metric[]> {
    return this.metricsStore;
  }
}

export const metricsService = new MetricsService();
