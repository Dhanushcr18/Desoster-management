import React from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Image,
  Users,
  Shield
} from 'lucide-react';

interface AdminStatsProps {
  stats: {
    total: number;
    high: number;
    medium: number;
    low: number;
    withPhotos: number;
    needsHelp: number;
  };
  onFilterChange: (filter: 'all' | 'high' | 'medium' | 'low' | 'photos' | 'help') => void;
  activeFilter: string;
}

export default function AdminStats({ stats, onFilterChange, activeFilter }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8 relative">
      {/* Total Disasters */}
      <button
        onClick={() => onFilterChange('all')}
        className={`group relative bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'all' ? 'border-purple-400 ring-4 ring-purple-500/50' : 'border-purple-500/50'
        } hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.total}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-purple-200 mb-2">Total Disasters</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 w-full animate-pulse shadow-lg"></div>
          </div>
        </div>
      </button>

      {/* High Priority */}
      <button
        onClick={() => onFilterChange('high')}
        className={`group relative bg-gradient-to-br from-red-600/30 to-orange-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'high' ? 'border-red-400 ring-4 ring-red-500/50' : 'border-red-500/50'
        } hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:to-orange-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-2xl shadow-xl">
              <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.high}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-red-200 mb-2">🔴 High Priority</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500 shadow-lg"
              style={{ width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </button>

      {/* Medium Priority */}
      <button
        onClick={() => onFilterChange('medium')}
        className={`group relative bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'medium' ? 'border-yellow-400 ring-4 ring-yellow-500/50' : 'border-yellow-500/50'
        } hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-orange-500/0 group-hover:from-yellow-500/10 group-hover:to-orange-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-2xl shadow-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.medium}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-yellow-200 mb-2">🟡 Medium Priority</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500 shadow-lg"
              style={{ width: `${stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </button>

      {/* Low Priority */}
      <button
        onClick={() => onFilterChange('low')}
        className={`group relative bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'low' ? 'border-blue-400 ring-4 ring-blue-500/50' : 'border-blue-500/50'
        } hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-2xl shadow-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.low}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-blue-200 mb-2">🔵 Low Priority</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500 shadow-lg"
              style={{ width: `${stats.total > 0 ? (stats.low / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </button>

      {/* With Photos */}
      <button
        onClick={() => onFilterChange('photos')}
        className={`group relative bg-gradient-to-br from-pink-600/30 to-purple-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'photos' ? 'border-pink-400 ring-4 ring-pink-500/50' : 'border-pink-500/50'
        } hover:border-pink-400 hover:shadow-2xl hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-3 rounded-2xl shadow-xl">
              <Image className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.withPhotos}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-pink-200 mb-2">📸 With Photos</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500 shadow-lg"
              style={{ width: `${stats.total > 0 ? (stats.withPhotos / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </button>

      {/* People Need Help */}
      <button
        onClick={() => onFilterChange('help')}
        className={`group relative bg-gradient-to-br from-orange-600/30 to-red-600/30 backdrop-blur-xl rounded-3xl p-6 border-2 ${
          activeFilter === 'help' ? 'border-orange-400 ring-4 ring-orange-500/50' : 'border-orange-500/50'
        } hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 cursor-pointer text-left w-full`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-red-500/0 group-hover:from-orange-500/10 group-hover:to-red-500/10 rounded-3xl transition-all duration-300"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-2xl shadow-xl">
              <Users className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.needsHelp}</p>
            </div>
          </div>
          <p className="text-sm font-bold text-orange-200 mb-2">🆘 Need Help</p>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 w-full animate-pulse shadow-lg"></div>
          </div>
        </div>
      </button>
    </div>
  );
}
