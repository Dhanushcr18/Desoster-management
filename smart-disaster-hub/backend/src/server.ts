import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import alertRoutes from './routes/alert.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';
import { initializeSocketIO } from './sockets/socket.handler';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
