import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db';
import { initSocket } from './services/socket.service';
import { startKafka } from './services/kafka.service';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRoutes);

app.get('/api/ping', (req, res) => res.send('pong'));

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Initialize WebSockets
    initSocket(httpServer);

    // Start Kafka Consumer (Background Service)
    await startKafka();

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
      console.log(`
      🚀 Analytical Service is screaming!
      📡 API: http://localhost:${PORT}/api
      🔌 WebSockets: ws://localhost:${PORT}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();