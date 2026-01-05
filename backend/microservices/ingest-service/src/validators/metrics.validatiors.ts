import { z } from "zod";

export const metricSchema = z.object({
  category: z.enum(["body_composition", "activity", "sleep", "nutrition"]),
  metric_type: z.string(),
  value: z.number(),
  unit: z.string(),
  recorded_at: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid timestamp",
  }),
  source: z.string().optional(),
});

export const batchSchema = z.object({
  metrics: z.array(metricSchema).min(1, "Provide at least one metric"),
});
