import { Request, Response } from "express";
import { userMetricsSchema } from "../validators/metrics.validatiors";
import { metricsService } from "../services/metrics.service";

export const ingestMetrics = async (req: Request, res: Response) => {
  try {
    const parsed = userMetricsSchema.parse(req.body);

    const [systolic, diastolic] = req.body.blood_pressure
      .split("/")
      .map(Number);

    const singleMetric = {
      ...parsed,
      systolic_bp: systolic,
      diastolic_bp: diastolic,
    };

    delete (singleMetric as any).blood_pressure;

    await metricsService.storeAndForward(singleMetric, req.userId);

    res.status(201).json({
      message: "Metrics ingested and forwarded successfully",
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.errors || err.message,
    });
  }
};

export const getMetrics = async (req: Request, res: Response) => {
  const metrics = await metricsService.getAll();
  res.json(metrics);
};
