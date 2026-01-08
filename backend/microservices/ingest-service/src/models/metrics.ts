export interface UserMetricsEvent {
  gender: "Male" | "Female";
  age: number;

  sleep_duration: number;
  quality_of_sleep: number;
  physical_activity_level: number;
  stress_level?: number;

  bmi_category: "Underweight" | "Normal" | "Overweight" | "Obese";

  blood_pressure: string; 
  systolic_bp: number;
  diastolic_bp: number;

  heart_rate: number;
  daily_steps: number;
}
