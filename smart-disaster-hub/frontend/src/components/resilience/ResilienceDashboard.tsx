import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  Activity,
  History,
  TrendingDown,
  Layers,
  AlertTriangle,
  RefreshCw,
  Radio,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Header from '../Header';
import ShipmentMap from './ShipmentMap';
import DecisionFeed from './DecisionFeed';
import ImpactPanel from './ImpactPanel';
import ReplayControls from './ReplayControls';
import AgentStatusBadge from './AgentStatusBadge';
import RiskTable from './RiskTable';
import ToastContainer from '../ToastContainer';
import { resilienceAPI } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import type {
  Shipment,
  RoadRisk,
  Warehouse,
  AgentDecision,
  ImpactMetrics,
  AgentStatusInfo,
  ReplayStatus,
  ReplayComparison,
} from '../../types';

export const ResilienceDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = !!user || !!localStorage.getItem('adminToken');

  // State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [roads, setRoads] = useState<RoadRisk[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [impact, setImpact] = useState<ImpactMetrics | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusInfo | null>(null);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus | null>(null);
  const [replayComparison, setReplayComparison] = useState<ReplayComparison | null>(null);

  const [selectedScenario, setSelectedScenario] = useState('kerala-2018');
  const [replaySpeed, setReplaySpeed] = useState(2);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);

  // In-app toasts for REROUTE / ESCALATE
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  >([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tabs for mobile / right panel
  const [activeTab, setActiveTab] = useState<'decisions' | 'impact' | 'replay' | 'roads'>('decisions');

  // Loading & error handling (including cold-start retry)
  const [loading, setLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [whData, shipData, roadData, decData, impactData, statusData, compData] =
        await Promise.allSettled([
          resilienceAPI.getWarehouses(),
          resilienceAPI.getShipments(),
          resilienceAPI.getRoadRisks(),
          resilienceAPI.getDecisions(30),
          resilienceAPI.getImpact(),
          resilienceAPI.getAgentStatus(),
          resilienceAPI.getReplayComparison(selectedScenario),
        ]);

      if (whData.status === 'fulfilled') setWarehouses(whData.value);
      if (shipData.status === 'fulfilled') setShipments(shipData.value);
      if (roadData.status === 'fulfilled') setRoads(roadData.value);
      if (decData.status === 'fulfilled') setDecisions(decData.value);
      if (impactData.status === 'fulfilled') setImpact(impactData.value);
      if (statusData.status === 'fulfilled') setAgentStatus(statusData.value);
      if (compData.status === 'fulfilled') setReplayComparison(compData.value);

      setIsWakingUp(false);
    } catch (err: any) {
      console.warn('Initial load error:', err);
      setIsWakingUp(true);
      setError('Backend service might be waking up (cold start). Retrying...');
    } finally {
      setLoading(false);
    }
  }, [selectedScenario]);

  useEffect(() => {
    loadInitialData();

    // Socket.IO real-time listeners
    const socket = socketService.connect();

    // 1. Shipment updates
    const handleShipmentUpdate = (updated: Shipment) => {
      setShipments((prev) => {
        const index = prev.findIndex((s) => s.id === updated.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updated };
          return next;
        }
        return [updated, ...prev];
      });
    };

    // 2. Agent decision updates
    const handleAgentDecision = (newDecision: AgentDecision) => {
      setDecisions((prev) => [newDecision, ...prev.slice(0, 49)]);
      // Refresh impact metrics when a decision arrives
      resilienceAPI.getImpact().then(setImpact).catch(() => {});

      if (newDecision.decision === 'REROUTE' || newDecision.decision === 'ESCALATE') {
        const isReroute = newDecision.decision === 'REROUTE';
        setToasts((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            title: isReroute ? '⚡ Proactive Reroute Triggered' : '🚨 Route Escalation Alert',
            message: newDecision.reasoning,
            type: isReroute ? 'warning' : 'error',
          },
        ]);
      }
    };

    // 3. Risk updates
    const handleRiskUpdate = (data: { roadId: number; riskLevel: any; riskScore: number; reason: string }) => {
      setRoads((prev) =>
        prev.map((r) =>
          r.id === data.roadId
            ? { ...r, riskLevel: data.riskLevel, riskScore: data.riskScore, riskReason: data.reason }
            : r
        )
      );
    };

    // 4. Replay tick
    const handleReplayTick = (tickData: any) => {
      setReplayStatus((prev) => ({
        ...(prev || {
          currentHourIndex: 0,
          totalHours: 240,
          speed: 2,
        }),
        status: tickData.status || 'running',
        scenario: tickData.scenario,
        simulatedTime: tickData.simulatedTime,
        progress: tickData.progress,
      }));
    };

    socketService.onShipmentUpdate(handleShipmentUpdate);
    socketService.onAgentDecision(handleAgentDecision);
    socketService.onRiskUpdate(handleRiskUpdate);
    socketService.onReplayTick(handleReplayTick);

    return () => {
      socketService.offShipmentUpdate(handleShipmentUpdate);
      socketService.offAgentDecision(handleAgentDecision);
      socketService.offRiskUpdate(handleRiskUpdate);
      socketService.offReplayTick(handleReplayTick);
    };
  }, [loadInitialData]);

  // Trigger agent run
  const handleTriggerRun = async () => {
    try {
      const res = await resilienceAPI.triggerAgentRun();
      setAgentStatus(res.status);
      // Reload decisions and impact
      const [newDec, newImp, newShips] = await Promise.all([
        resilienceAPI.getDecisions(30),
        resilienceAPI.getImpact(),
        resilienceAPI.getShipments(),
      ]);
      setDecisions(newDec);
      setImpact(newImp);
      setShipments(newShips);
    } catch (err: any) {
      console.error('Trigger agent error:', err);
    }
  };

  // Replay handlers
  const handleStartReplay = async (scenario: string, sp: number) => {
    try {
      const res = await resilienceAPI.startReplay(scenario, sp);
      setReplayStatus(res.status);
      const comp = await resilienceAPI.getReplayComparison(scenario);
      setReplayComparison(comp);
    } catch (err: any) {
      console.error('Replay start error:', err);
    }
  };

  const handlePauseReplay = async () => {
    try {
      const res = await resilienceAPI.pauseReplay();
      setReplayStatus(res.status);
    } catch (err: any) {
      console.error('Replay pause error:', err);
    }
  };

  const handleStopReplay = async () => {
    try {
      const res = await resilienceAPI.stopReplay();
      setReplayStatus(res.status);
    } catch (err: any) {
      console.error('Replay stop error:', err);
    }
  };

  if (loading && !shipments.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Initializing Supply Resilience Platform...</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Connecting to Open-Meteo weather intelligence and autonomous agent dispatch network.
        </p>
      </div>
    );
  }

  const isReplayActive = replayStatus?.status === 'running';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      {/* Top Banner: Transparency & Simulation notice */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider text-[10px]">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            Simulated Demonstration
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Autonomous agent proactively reroutes logistics corridors before flood closures.
          </span>
        </div>

        {isReplayActive && (
          <div className="flex items-center gap-2 text-amber-300 font-mono text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <span>Historical Replay Active:</span>
            <span>{selectedScenario}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col gap-4 max-w-[1600px] w-full mx-auto">
        {/* Top Control & Status Strip */}
        <AgentStatusBadge
          status={agentStatus}
          onTriggerRun={handleTriggerRun}
          isAdmin={isAdmin}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Left Column: Interactive Corridor Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-[520px] lg:min-h-[640px]">
            <ShipmentMap
              shipments={shipments}
              roads={roads}
              warehouses={warehouses}
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={(s) => setSelectedShipmentId(s.id)}
            />
          </div>

          {/* Right Column: Tabbed Intelligence Panels (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Panel Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('decisions')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'decisions'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Decisions ({decisions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('impact')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'impact'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Impact
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('replay')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'replay'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Replay Demo
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('roads')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeTab === 'roads'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Roads ({roads.length})
              </button>
            </div>

            {/* Tab Views */}
            <div className="flex-1 min-h-[460px]">
              {activeTab === 'decisions' && <DecisionFeed decisions={decisions} />}
              {activeTab === 'impact' && (
                <ImpactPanel impact={impact} comparison={replayComparison} />
              )}
              {activeTab === 'replay' && (
                <ReplayControls
                  status={replayStatus}
                  onStart={handleStartReplay}
                  onPause={handlePauseReplay}
                  onStop={handleStopReplay}
                  selectedScenario={selectedScenario}
                  onSelectScenario={setSelectedScenario}
                  speed={replaySpeed}
                  onSpeedChange={setReplaySpeed}
                />
              )}
              {activeTab === 'roads' && <RiskTable roads={roads} />}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default ResilienceDashboard;
