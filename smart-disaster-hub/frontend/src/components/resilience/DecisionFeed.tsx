import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  PauseCircle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  Cpu,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { AgentDecision, DecisionType } from '../../types';

interface DecisionFeedProps {
  decisions: AgentDecision[];
}

function getDecisionBadge(type: DecisionType) {
  switch (type) {
    case 'REROUTE':
      return {
        label: 'REROUTE',
        icon: <GitFork className="w-3.5 h-3.5" />,
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      };
    case 'HOLD':
      return {
        label: 'HOLD',
        icon: <PauseCircle className="w-3.5 h-3.5" />,
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'ESCALATE':
      return {
        label: 'ESCALATE',
        icon: <AlertOctagon className="w-3.5 h-3.5" />,
        badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    case 'CONTINUE':
    default:
      return {
        label: 'CONTINUE',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      };
  }
}

export const DecisionFeed: React.FC<DecisionFeedProps> = ({ decisions }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl p-4 overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Autonomous Agent Decision Feed</h3>
            <p className="text-xs text-slate-400">Live sense & reroute log</p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
          {decisions.length} events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {decisions.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Cpu className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
            <span>Agent standing by. No incidents detected yet.</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {decisions.map((item) => {
              const badge = getDecisionBadge(item.decision);
              const isGemini = item.explanationSource === 'gemini';
              const formattedTime = new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <motion.div
                  key={`decision-${item.id}`}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.badgeClass}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      {item.shipment && (
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {item.shipment.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formattedTime}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {item.reasoning}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {item.estimatedDelayAvoidedMin > 0 && (
                        <span className="text-emerald-400 font-medium">
                          +{Math.round(item.estimatedDelayAvoidedMin / 60)}h avoided
                        </span>
                      )}
                      {item.extraMinutes > 0 && (
                        <span className="text-slate-400">
                          +{item.extraMinutes}m detour
                        </span>
                      )}
                    </div>

                    {/* Gemini vs Deterministic chip */}
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        isGemini
                          ? 'bg-purple-950/50 text-purple-300 border-purple-800/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isGemini ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          Gemini
                        </>
                      ) : (
                        <>
                          <Cpu className="w-2.5 h-2.5 text-slate-400" />
                          Template
                        </>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default DecisionFeed;
