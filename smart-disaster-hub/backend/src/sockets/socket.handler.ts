import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const initializeSocketIO = (io: Server): void => {
  // Socket.IO middleware for authentication
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`✅ User connected: ${userId}`);

    // Join default alerts room
    socket.join('alerts');

    // Join location-based room (if provided)
    socket.on('join:location', (data: { bbox?: string; city?: string }) => {
      if (data.bbox) {
        socket.join(`bbox:${data.bbox}`);
        console.log(`User ${userId} joined bbox room: ${data.bbox}`);
      }
      if (data.city) {
        socket.join(`city:${data.city}`);
        console.log(`User ${userId} joined city room: ${data.city}`);
      }
    });

    // Leave location-based room
    socket.on('leave:location', (data: { bbox?: string; city?: string }) => {
      if (data.bbox) {
        socket.leave(`bbox:${data.bbox}`);
      }
      if (data.city) {
        socket.leave(`city:${data.city}`);
      }
    });

    // Handle user marking status (alternative to HTTP)
    socket.on('report:status', (data: { alertId: string; status: 'safe' | 'help' }) => {
      // Broadcast status update to all in alerts room
      socket.to('alerts').emit('report:update', {
        userId,
        ...data
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
    });
  });

  console.log('✅ Socket.IO handlers initialized');
};
