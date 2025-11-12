import AlertCard from './AlertCard';
import type { Alert } from '../types';
import { Users, AlertTriangle } from 'lucide-react';

interface SidebarProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

export default function Sidebar({ alerts, onAlertClick }: SidebarProps) {
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;

  return (
    <aside className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Stats Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Active Alerts</h2>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={16} />
              <span className="text-red-500 font-semibold">{highAlerts}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">High Priority</p>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={16} />
              <span className="text-yellow-500 font-semibold">{mediumAlerts}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Medium Priority</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Users size={48} className="mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">You'll be notified of any new emergencies</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onClick={() => onAlertClick(alert)} />
          ))
        )}
      </div>
    </aside>
  );
}
