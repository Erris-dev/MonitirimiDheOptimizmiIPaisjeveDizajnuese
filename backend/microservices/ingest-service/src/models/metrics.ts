export type MetricCategory = "body_composition" | "activity" | "sleep" | "nutrition";

export interface Metric {
  category: MetricCategory;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  source?: string;
  userId?: string;
}
