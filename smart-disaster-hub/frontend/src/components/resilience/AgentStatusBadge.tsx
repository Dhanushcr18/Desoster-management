import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { AgentStatusInfo } from '../../types';

interface AgentStatusBadgeProps {
  status: AgentStatusInfo | null;
  onTriggerRun: () => Promise<void>;
  isAdmin?: boolean;
}

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({
  status,
  onTriggerRun,
  isAdmin = true,
}) => {
  const [isRunningManual, setIsRunningManual] = useState(false);

  const handleRun = async () => {
    setIsRunningManual(true);
    try {
      await onTriggerRun();
    } finally {
      setIsRunningManual(false);
    }
  };

  const lastRunText = status?.lastRunTime
    ? new Date(status.lastRunTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Pending initial cycle';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Autonomous Supply Agent
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Last cycle: <span className="text-slate-200">{lastRunText}</span> • Cycle interval: {status?.intervalMinutes ?? 5}m
          </p>
        </div>
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunningManual || status?.isRunning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningManual ? 'animate-spin' : ''}`} />
          <span>{isRunningManual ? 'Evaluating...' : 'Run Cycle Now'}</span>
        </button>
      )}
    </div>
  );
};

export default AgentStatusBadge;
