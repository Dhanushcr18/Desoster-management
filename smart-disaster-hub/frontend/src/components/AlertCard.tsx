import type { Alert } from '../types';
import { AlertCircle, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

interface AlertCardProps {
  alert: Alert;
  onClick: () => void;
}

const severityColors = {
  high: 'border-red-500 bg-red-500/10',
  medium: 'border-yellow-500 bg-yellow-500/10',
  low: 'border-blue-500 bg-blue-500/10'
};

const severityTextColors = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500'
};

export default function AlertCard({ alert, onClick }: AlertCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group border-2 ${severityColors[alert.severity]} rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-gray-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-in`}
    >
      <div className="flex items-start gap-2 sm:gap-3 mb-2">
        <div className={`${severityTextColors[alert.severity]} bg-gray-800 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
          <AlertCircle size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm sm:text-base leading-tight mb-1 truncate">{alert.title}</h3>
          <span className={`inline-block text-xs font-bold uppercase px-2 py-0.5 rounded-full ${severityTextColors[alert.severity]} bg-gray-800`}>
            {alert.severity}
          </span>
        </div>
      </div>

      <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">{alert.description}</p>

      <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-400 flex-wrap">
        <div className="flex items-center gap-1">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">{alert.source}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="flex-shrink-0" />
          <span className="whitespace-nowrap">{formatDistanceToNow(alert.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
