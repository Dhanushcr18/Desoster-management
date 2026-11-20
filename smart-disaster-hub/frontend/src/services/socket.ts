import { io, Socket } from 'socket.io-client';
import type { Alert, ReportStats, Shipment, AgentDecision } from '../types';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const authToken = token || localStorage.getItem('token') || localStorage.getItem('adminToken') || '';

    this.socket = io(SOCKET_URL, {
      auth: { token: authToken },
      autoConnect: true,
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

  // ─────────────────────────────────────────────────────────────
  // Supply Resilience Platform Socket Listeners
  // ─────────────────────────────────────────────────────────────

  onRiskUpdate(callback: (data: { roadId: number; name: string; riskLevel: string; riskScore: number; reason: string }) => void): void {
    this.socket?.on('risk:update', callback);
  }

  onShipmentUpdate(callback: (shipment: Shipment) => void): void {
    this.socket?.on('shipment:update', callback);
  }

  onAgentDecision(callback: (decision: AgentDecision & { shipmentCode?: string; driverMessage?: string }) => void): void {
    this.socket?.on('agent:decision', callback);
  }

  onReplayTick(callback: (data: any) => void): void {
    this.socket?.on('replay:tick', callback);
  }

  // Remove listeners
  offNewAlert(callback?: (alert: Alert) => void): void {
    this.socket?.off('alert:new', callback);
  }

  offReportUpdate(callback?: (data: { alertId: string; reportStats: ReportStats }) => void): void {
    this.socket?.off('report:update', callback);
  }

  offRiskUpdate(callback?: (data: any) => void): void {
    this.socket?.off('risk:update', callback);
  }

  offShipmentUpdate(callback?: (data: any) => void): void {
    this.socket?.off('shipment:update', callback);
  }

  offAgentDecision(callback?: (data: any) => void): void {
    this.socket?.off('agent:decision', callback);
  }

  offReplayTick(callback?: (data: any) => void): void {
    this.socket?.off('replay:tick', callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
