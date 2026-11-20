import React, { useState } from 'react';
import { AlertTriangle, ArrowUpDown, ShieldAlert, Mountain } from 'lucide-react';
import type { RoadRisk } from '../../types';

interface RiskTableProps {
  roads: RoadRisk[];
}

export const RiskTable: React.FC<RiskTableProps> = ({ roads }) => {
  const [sortField, setSortField] = useState<'riskScore' | 'rainfall48h'>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedRoads = [...roads].sort((a, b) => {
    const valA = (a[sortField] as number) || 0;
    const valB = (b[sortField] as number) || 0;
    return sortAsc ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'riskScore' | 'rainfall48h') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Vulnerable Road Corridors</h3>
            <p className="text-xs text-slate-400">Predicted flood and landslide hazard</p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
          {roads.length} corridors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950/40">
            <tr>
              <th className="py-2.5 px-3">Corridor</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => toggleSort('riskScore')}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => toggleSort('rainfall48h')}
              >
                <div className="flex items-center gap-1">
                  <span>48h Rain</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Terrain / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {sortedRoads.map((r) => {
              const isSevere = r.riskLevel === 'severe';
              const isHigh = r.riskLevel === 'high';
              const isModerate = r.riskLevel === 'moderate';

              let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              if (isSevere) badgeClass = 'bg-red-500/15 text-red-400 border-red-500/30';
              else if (isHigh) badgeClass = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
              else if (isModerate) badgeClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';

              return (
                <tr key={`risk-row-${r.id}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    <div>{r.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {r.coordinates?.length || 0} GPS sample waypoints
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}
                    >
                      {r.riskScore}% {r.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="text-slate-200">{r.rainfall48h ?? 0} mm</span>
                    <span className="text-[10px] text-slate-500 block">
                      peak {r.peakHourlyRain ?? 0} mm/h
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">
                    {r.riskReason || 'Normal meteorological forecast'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskTable;
