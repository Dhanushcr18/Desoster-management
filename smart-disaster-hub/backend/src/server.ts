import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import env from './config/env';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import alertRoutes from './routes/alert.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';
import roadRoutes from './routes/road.routes';
import warehouseRoutes from './routes/warehouse.routes';
import shipmentRoutes from './routes/shipment.routes';
import riskRoutes from './routes/risk.routes';
import agentRoutes from './routes/agent.routes';
import impactRoutes from './routes/impact.routes';
import replayRoutes from './routes/replay.routes';
import { initializeSocketIO } from './sockets/socket.handler';
import { errorHandler } from './middleware/error.middleware';
import { startAgentInterval } from './services/agent.service';
import { startSimulation } from './services/simulation.service';

// Load environment variables
dotenv.config();

// Initialize models (must be done before using routes)
import './config/models';

// Initialize Express app
const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Smart Disaster Hub & Supply Resilience Platform',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roads', roadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/replay', replayRoutes);

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);

      // Start autonomous agent cycle and truck movement simulator
      startAgentInterval();
      startSimulation();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, io, httpServer };
