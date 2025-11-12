import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminAlertCard from './AdminAlertCard';
import AdminStats from './AdminStats';
import { alertsAPI } from '../services/api';
import socketService from '../services/socket';
import type { AlertWithStats } from '../types';
import { 
  Shield, 
  LogOut, 
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Users,
  MapPin,
  Phone,
  Bell,
  Activity,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    withPhotos: 0,
    needsHelp: 0
  });

  useEffect(() => {
    // Check if user is admin (you can add role check here)
    loadAlerts();
    setupSocketListeners();

    return () => {
      socketService.offNewAlert();
      socketService.offReportUpdate();
    };
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsAPI.getAll();
      const alertsList = data.alerts || [];
      setAlerts(alertsList);
      calculateStats(alertsList);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (alertsList: AlertWithStats[]) => {
    const stats = {
      total: alertsList.length,
      high: alertsList.filter(a => a.severity === 'high').length,
      medium: alertsList.filter(a => a.severity === 'medium').length,
      low: alertsList.filter(a => a.severity === 'low').length,
      withPhotos: alertsList.filter(a => a.photos && a.photos.length > 0).length,
      needsHelp: alertsList.reduce((sum, a) => sum + (a.reportStats?.help || 0), 0)
    };
    setStats(stats);
  };

  const setupSocketListeners = () => {
    socketService.joinAlertsRoom();

    socketService.onNewAlert((alert) => {
      setAlerts((prev) => [alert, ...prev]);
      calculateStats([alert, ...alerts]);
    });

    socketService.onReportUpdate((data) => {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === data.alertId
            ? { ...alert, reportStats: data.reportStats }
            : alert
        )
      );
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFilterChange = (filter: 'all' | 'high' | 'medium' | 'low' | 'photos' | 'help') => {
    setActiveFilter(filter);
    
    // Update severity filter
    if (filter === 'all') {
      setFilterSeverity('all');
    } else if (['high', 'medium', 'low'].includes(filter)) {
      setFilterSeverity(filter);
    } else {
      setFilterSeverity('all');
    }
    
    // Scroll to alerts section
    const alertsSection = document.getElementById('alerts-section');
    if (alertsSection) {
      alertsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredAlerts = alerts
    .filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           alert.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
      
      // Additional filters
      let matchesFilter = true;
      if (activeFilter === 'photos') {
        matchesFilter = alert.photos && alert.photos.length > 0;
      } else if (activeFilter === 'help') {
        matchesFilter = (alert.reportStats?.help || 0) > 0;
      }
      
      return matchesSearch && matchesSeverity && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by severity first, then by date
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-2xl sticky top-0 z-50 border-b-4 border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-white/20">
                  <Shield className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white drop-shadow-lg tracking-tight">
                  ADMIN CONTROL
                </h1>
                <p className="text-sm text-white/90 font-semibold">Emergency Response Command Center</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              {/* User Dashboard Link */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20"
                title="Switch to User Dashboard"
              >
                <MapPin className="h-5 w-5" />
                <span className="hidden lg:inline">User Dashboard</span>
              </button>

              {/* Emergency Numbers Button */}
              <button
                onClick={() => setShowEmergencyPanel(!showEmergencyPanel)}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/20"
              >
                <Phone className="h-5 w-5 animate-pulse" />
                <span className="hidden lg:inline">Emergency Hotline</span>
              </button>

              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-white/70">Administrator</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition backdrop-blur-sm border border-white/20"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Numbers Panel */}
      {showEmergencyPanel && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-red-500/50 shadow-2xl animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-3 rounded-xl">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Global Emergency Hotlines</h3>
                  <p className="text-sm text-white/80">Click any number to call immediately</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyPanel(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* India */}
              <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-4 transform hover:scale-105 transition-all duration-300 shadow-lg">
                <div className="text-4xl mb-3">🇮🇳</div>
                <h4 className="text-white font-bold mb-3">India</h4>
                <div className="space-y-2">
                  <a href="tel:100" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🚓 Police: 100
                  </a>
                  <a href="tel:101" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🚒 Fire: 101
                  </a>
                  <a href="tel:102" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🚑 Ambulance: 102
                  </a>
                  <a href="tel:1078" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    ⚠️ Disaster: 1078
                  </a>
                </div>
              </div>

              {/* USA */}
              <div className="bg-gradient-to-br from-blue-600 to-red-600 rounded-xl p-4 transform hover:scale-105 transition-all duration-300 shadow-lg">
                <div className="text-4xl mb-3">🇺🇸</div>
                <h4 className="text-white font-bold mb-3">United States</h4>
                <div className="space-y-2">
                  <a href="tel:911" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🚨 All Emergency: 911
                  </a>
                  <a href="tel:1-800-621-3362" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold text-sm transition">
                    ⚠️ FEMA: 1-800-621-3362
                  </a>
                  <a href="mailto:fema@dhs.gov" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold text-xs transition">
                    📧 fema@dhs.gov
                  </a>
                </div>
              </div>

              {/* UK */}
              <div className="bg-gradient-to-br from-blue-700 to-red-600 rounded-xl p-4 transform hover:scale-105 transition-all duration-300 shadow-lg">
                <div className="text-4xl mb-3">🇬🇧</div>
                <h4 className="text-white font-bold mb-3">United Kingdom</h4>
                <div className="space-y-2">
                  <a href="tel:999" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🚨 All Emergency: 999
                  </a>
                  <a href="tel:112" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🆘 EU Emergency: 112
                  </a>
                  <a href="tel:0800-107-0059" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold text-sm transition">
                    ⚠️ Disaster: 0800-107-0059
                  </a>
                </div>
              </div>

              {/* International */}
              <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-xl p-4 transform hover:scale-105 transition-all duration-300 shadow-lg">
                <div className="text-4xl mb-3">🌍</div>
                <h4 className="text-white font-bold mb-3">International</h4>
                <div className="space-y-2">
                  <a href="tel:112" className="block bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🆘 EU Emergency: 112
                  </a>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white rounded-lg p-2 text-center font-bold transition">
                    🌐 More Countries
                  </button>
                  <p className="text-xs text-white/80 text-center mt-2">
                    Click for complete emergency contact list
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <AdminStats stats={stats} onFilterChange={handleFilterChange} activeFilter={activeFilter} />

        {/* Controls */}
        <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border-2 border-purple-500/30">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 group-focus-within:text-pink-400 transition-colors" />
                <input
                  type="text"
                  placeholder="🔍 Search disasters by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/70 border-2 border-purple-500/30 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 font-medium"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <Filter className="h-5 w-5 text-purple-300" />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-5 py-4 bg-slate-900/70 border-2 border-purple-500/30 rounded-2xl text-white font-semibold focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 cursor-pointer"
              >
                <option value="all">🎯 All Severities</option>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🔵 Low Priority</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105 font-bold"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Alerts Grid */}
        <div id="alerts-section">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                <Activity className="relative h-20 w-20 text-purple-400 mx-auto mb-6 animate-spin" />
              </div>
              <p className="text-white text-xl font-bold mb-2">Loading Control Center...</p>
              <p className="text-purple-300 text-sm">Fetching disaster reports</p>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center border-2 border-purple-500/30">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl"></div>
              <AlertTriangle className="relative h-24 w-24 text-purple-400 mx-auto animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white mb-3">No Disasters Found</h3>
            <p className="text-purple-200 text-lg mb-8">
              {searchQuery || filterSeverity !== 'all'
                ? '🔍 Try adjusting your search or filter criteria'
                : '✅ No disaster reports have been submitted yet'}
            </p>
            
            {/* Link to User App */}
            {!searchQuery && filterSeverity === 'all' && (
              <div className="mt-8 space-y-4">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-6"></div>
                <p className="text-purple-300 text-sm mb-4">Want to report a disaster?</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300 border-2 border-emerald-500/50"
                >
                  <MapPin className="h-6 w-6" />
                  <span>Go to User Dashboard</span>
                  <span className="text-2xl">→</span>
                </button>
                <p className="text-purple-400 text-xs mt-4">Switch to user interface to report new disasters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-2 gap-4">
              <div className="flex items-center space-x-3">
                <h2 className="text-3xl font-black text-white flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <span>Active Disasters</span>
                </h2>
                {activeFilter !== 'all' && (
                  <button
                    onClick={() => handleFilterChange('all')}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg text-red-300 hover:text-red-200 text-sm font-semibold transition-all duration-300 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilter !== 'all' && (
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl border border-purple-400 animate-pulse">
                    <p className="text-sm text-white font-bold">
                      🎯 Filter: {activeFilter.toUpperCase()}
                    </p>
                  </div>
                )}
                <div className="px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
                  <p className="text-sm text-purple-200 font-semibold">
                    📊 {filteredAlerts.length} / {alerts.length} reports
                  </p>
                </div>
              </div>
            </div>
            
            {filteredAlerts.map((alert) => (
              <AdminAlertCard key={alert._id} alert={alert} onResolve={loadAlerts} />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
