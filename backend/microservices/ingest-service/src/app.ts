import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import metricsRoutes from "./routes/metrics.routes";
import { kafkaService } from "./services/kafka.service";
import client from "prom-client"; // 1. Import prom-client

const app = express();

// --- PROMETHEUS INFRASTRUCTURE ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metric: Track total data packets ingested
const ingestCounter = new client.Counter({
  name: "ingest_packets_total",
  help: "Total health data packets received by the Ingest Service",
  registers: [register],
});

// Expose /metrics for Prometheus to scrape
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// --- MIDDLEWARE & BUSINESS ROUTES ---
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Add a middleware to count every request to your ingest business routes
app.use((req, res, next) => {
  if (req.path !== "/metrics") {
    ingestCounter.inc();
  }
  next();
});

app.use("/", metricsRoutes);

// --- KAFKA CONNECTION ---
kafkaService.connect().catch(err => console.error("Kafka connection failed:", err));

export default app;