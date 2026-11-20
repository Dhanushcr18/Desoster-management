import React from 'react';
import { Play, Pause, Square, History, Zap, CheckCircle2 } from 'lucide-react';
import type { ReplayStatus } from '../../types';

interface ReplayControlsProps {
  status: ReplayStatus | null;
  onStart: (scenario: string, speed: number) => void;
  onPause: () => void;
  onStop: () => void;
  selectedScenario: string;
  onSelectScenario: (sc: string) => void;
  speed: number;
  onSpeedChange: (sp: number) => void;
  isLoading?: boolean;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  selectedScenario,
  onSelectScenario,
  speed,
  onSpeedChange,
  isLoading = false,
}) => {
  const isRunning = status?.status === 'running';
  const progressPct = Math.round((status?.progress ?? 0) * 100);

  const formattedSimTime = status?.simulatedTime
    ? new Date(status.simulatedTime).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : 'Ready to replay';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Historical Replay & Demo Mode</h3>
            <p className="text-xs text-slate-400">Simulate major weather crises offline</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Cached Offline
        </span>
      </div>

      {/* Scenario Selector & Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Scenario dropdown */}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Historical Disaster Scenario
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
          >
            <option value="kerala-2018">Kerala 2018 (Aug 10 - 20) - Western Ghats Deluge</option>
            <option value="chennai-2015">Chennai 2015 (Nov 28 - Dec 03) - Urban Cloudburst</option>
          </select>
        </div>

        {/* Speed multiplier */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Replay Speed
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  speed === s
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated Clock & Progress */}
      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Simulated Clock:
          </span>
          <span className="font-mono font-bold text-amber-300">{formattedSimTime}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-1">
          <div
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Start</span>
          <span>{progressPct}% Timeline Progress</span>
          <span>End</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={() => onStart(selectedScenario, speed)}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Scenario Replay
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition-all"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            Pause Replay
          </button>
        )}

        <button
          type="button"
          onClick={onStop}
          disabled={!status || status.status === 'idle'}
          className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs transition-all disabled:opacity-40"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default ReplayControls;
