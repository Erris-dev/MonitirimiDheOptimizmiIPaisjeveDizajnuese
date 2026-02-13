import { Router } from "express";
import { ingestMetrics, getMetrics } from "../controllers/metrics.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/metrics/ingest", ingestMetrics);
router.get("/metrics", getMetrics);

export default router;
