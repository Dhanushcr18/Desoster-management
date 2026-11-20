import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Navigation,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Phone,
  Truck,
} from 'lucide-react';
import { resilienceAPI } from '../../services/api';
import socketService from '../../services/socket';
import type { Shipment } from '../../types';

export const DriverView: React.FC = () => {
  const { shipmentCode } = useParams<{ shipmentCode: string }>();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!shipmentCode) return;
    try {
      setLoading(true);
      setError(null);
      const data = await resilienceAPI.getShipmentByCode(shipmentCode);
      setShipment(data);
    } catch (err: any) {
      setError(err.message || 'Shipment not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live socket updates
    socketService.connect();
    const handleUpdate = (updated: Shipment) => {
      if (updated.code === shipmentCode) {
        setShipment(updated);
      }
    };

    socketService.onShipmentUpdate(handleUpdate);
    return () => {
      socketService.offShipmentUpdate(handleUpdate);
    };
  }, [shipmentCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading live driver dispatch route...</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold mb-2">Truck Not Found</h1>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Could not locate dispatch records for code: <span className="font-mono text-cyan-300">{shipmentCode}</span>.
        </p>
        <Link
          to="/resilience"
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
        >
          Go to Resilience Hub
        </Link>
      </div>
    );
  }

  const isRerouted = shipment.status === 'rerouted';
  const latestDecision = shipment.decisions?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 max-w-lg mx-auto flex flex-col justify-between">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-400" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                Driver Route Terminal
              </span>
              <span className="font-mono text-lg font-black text-cyan-300">{shipment.code}</span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isRerouted
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : shipment.status === 'held'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {shipment.status}
          </span>
        </div>

        {/* Big Driver Instruction Banner */}
        <div
          className={`p-5 rounded-2xl border mb-5 shadow-2xl ${
            isRerouted
              ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border-cyan-500/50'
              : shipment.status === 'held'
              ? 'bg-amber-950/80 border-amber-500/50'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1.5">
            <Navigation className="w-4 h-4 animate-bounce" />
            <span>Active Navigation Instruction</span>
          </div>

          <div className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
            {isRerouted
              ? `Take Safe Alternate Corridor (+${latestDecision?.extraMinutes || 70} min)`
              : shipment.status === 'held'
              ? 'HOLD at safe staging depot. Flood hazard ahead.'
              : 'Proceed on primary corridor as scheduled'}
          </div>

          <div className="p-3 bg-black/40 rounded-xl text-xs text-slate-200 border border-white/10 leading-relaxed">
            {latestDecision?.reasoning ||
              'Corridor conditions monitored in real-time. Follow assigned GPS waypoints.'}
          </div>
        </div>

        {/* Trip Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Assigned Cargo</span>
            <span className="font-bold text-sm capitalize text-white flex items-center gap-1.5">
              <span>{shipment.cargoType}</span>
              <span className="text-[10px] text-rose-400 uppercase font-mono px-1 py-0.5 rounded bg-rose-500/10">
                {shipment.priority}
              </span>
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Estimated Arrival (ETA)</span>
            <span className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{shipment.etaMinutes} mins
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Route Origin</span>
            <span className="font-semibold text-xs text-slate-200">
              {shipment.originWarehouse?.name || 'Central Hub'}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Destination</span>
            <span className="font-semibold text-xs text-slate-200">
              {shipment.destinationWarehouse?.name || 'Regional Depot'}
            </span>
          </div>
        </div>

        {/* Driver contact and support */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Assigned Driver: {shipment.driverName}</div>
            <div className="text-[11px] text-slate-400">Emergency Dispatch: +91 80 2233 4455</div>
          </div>
          <a
            href="tel:112"
            className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="text-center pt-3 border-t border-slate-800">
        <Link
          to="/resilience"
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 underline"
        >
          View Full Regional Operations Hub &rarr;
        </Link>
      </div>
    </div>
  );
};

export default DriverView;
