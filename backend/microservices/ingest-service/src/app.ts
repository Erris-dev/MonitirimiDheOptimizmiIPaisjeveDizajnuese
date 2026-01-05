import express from "express";
import cors from "cors";
import metricsRoutes from "./routes/metrics.routes";
import { kafkaService } from "./services/kafka.service";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", metricsRoutes);

kafkaService.connect().catch(err => console.error("Kafka connection failed:", err));

export default app;
