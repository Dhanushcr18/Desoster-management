import { io, Socket } from 'socket.io-client';
import type { Alert, ReportStats } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join alerts room to receive real-time updates
  joinAlertsRoom(): void {
    if (this.socket?.connected) {
      // Already auto-joined on server
      console.log('Joined alerts room');
    }
  }

  // Listen for new alerts
  onNewAlert(callback: (alert: Alert) => void): void {
    this.socket?.on('alert:new', callback);
  }

  // Listen for report updates
  onReportUpdate(callback: (data: { alertId: string; reportStats: ReportStats }) => void): void {
    this.socket?.on('report:update', callback);
  }

  // Remove listeners
  offNewAlert(callback?: (alert: Alert) => void): void {
    this.socket?.off('alert:new', callback);
  }

  offReportUpdate(callback?: (data: { alertId: string; reportStats: ReportStats }) => void): void {
    this.socket?.off('report:update', callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
