import { Request, Response } from "express";
import { batchSchema } from "../validators/metrics.validatiors";
import { metricsService } from "../services/metrics.service";

export const ingestMetrics = async (req: Request, res: Response) => {
  try {
    const parsed = batchSchema.parse(req.body);
    await metricsService.storeAndForward(parsed.metrics, req.userId);
    res.status(201).json({ message: "Metrics ingested and forwarded successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.errors || err.message });
  }
};

export const getMetrics = async (req: Request, res: Response) => {
  const metrics = await metricsService.getAll();
  res.json(metrics);
};
