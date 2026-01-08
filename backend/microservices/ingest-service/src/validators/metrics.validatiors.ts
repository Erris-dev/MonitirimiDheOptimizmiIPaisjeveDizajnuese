// validators/metrics.validators.ts
import { z } from "zod";

export const userMetricsSchema = z.object({
  gender: z.enum(["Male", "Female"]),
  age: z.number().int().min(0).max(120),
  occupation: z.string(),
  sleep_duration: z.number().min(0).max(24),
  quality_of_sleep: z.number().int().min(1).max(10),
  physical_activity_level: z.number().min(0),
  stress_level: z.number().int().min(1).max(10).optional(),
  bmi_category: z.enum(["Underweight", "Normal", "Overweight", "Obese"]),
  blood_pressure: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, "Invalid blood pressure format (e.g. 120/80)"),
  heart_rate: z.number().int().min(30).max(220),
  daily_steps: z.number().min(0),
  sleep_disorder: z.string().optional(),
});


