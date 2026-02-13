import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import client from 'prom-client';

import { connectDB } from './config/db';
import { initSocket } from './services/socket.service';
import { startKafka } from './services/kafka.service';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- PROMETHEUS SETUP ---
// Initialize metrics registry and default metrics (CPU, Memory, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Expose the /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use(express.json());
app.use(cookieParser());

app.use('/', apiRoutes);

const startServer = async () => {
  try {
    await connectDB();
    initSocket(httpServer);
    await startKafka();

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
      console.log(`
      🚀 Analytical Service is screaming!
      📡 API: http://localhost:${PORT}/api
      📊 Metrics: http://localhost:${PORT}/metrics
      🔌 WebSockets: ws://localhost:${PORT}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();