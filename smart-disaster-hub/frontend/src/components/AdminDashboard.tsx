import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminAlertCard from './AdminAlertCard';
import type { AlertWithStats } from '../types';
import {
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  LogOut,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Transform backend flat {longitude, latitude} format into the {geometry.coordinates} shape
// that AlertWithStats / AdminAlertCard expect.
function normalizeAlert(raw: any): AlertWithStats {
  const longitude = parseFloat(raw.longitude ?? raw.geometry?.coordinates?.[0] ?? 0);
  const latitude  = parseFloat(raw.latitude  ?? raw.geometry?.coordinates?.[1] ?? 0);

  return {
    // Support both numeric `id` (SQLite) and string `_id` (Mongo-style)
    _id:          String(raw._id ?? raw.id),
    title:        raw.title,
    description:  raw.description,
    severity:     raw.severity as 'low' | 'medium' | 'high',
    source:       raw.source,
    verified:     raw.verified ?? false,
    photos:       Array.isArray(raw.photos) ? raw.photos : [],
    resolved:     raw.resolved ?? false,
    resolvedAt:   raw.resolvedAt,
    resolvedBy:   raw.resolvedBy,
    createdAt:    raw.createdAt,
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    reportStats: raw.reportStats ?? { safe: 0, help: 0 }
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getToken = () =>
    localStorage.getItem('token') || localStorage.getItem('adminToken') || '';

  const loadAlerts = useCallback(async () => {
    try {
      setError('');
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/alerts?limit=100`, { headers });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawAlerts: any[] = data.alerts || data || [];
      setAlerts(rawAlerts.map(normalizeAlert));
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
      setError(err.message || 'Failed to load alerts from server');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and auto-refresh every 30 s
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30_000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleRefresh = () => {
    setLoading(true);
    loadAlerts();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleResolve = () => {
    // Reload after resolving so stats update
    loadAlerts();
  };

  const filteredAlerts = alerts
    .filter(alert => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.source.toLowerCase().includes(q);
      const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (a.severity !== b.severity) return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    high:   alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low:    alerts.filter(a => a.severity === 'low').length,
    total:  alerts.length,
    resolved:   alerts.filter(a => a.resolved).length,
    unresolved: alerts.filter(a => !a.resolved).length,
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 overflow-x-hidden font-sans">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      {/* ── Header ── */}
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                  ADMIN CONTROL
                </h1>
                <p className="text-sm text-gray-400 font-medium">
                  Disaster Hub
                  {lastUpdated && (
                    <span className="ml-2 text-gray-500">
                      • Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* ── Stats ── */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {[
            { label: 'High Priority',   value: stats.high,       bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
            { label: 'Medium Priority', value: stats.medium,     bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
            { label: 'Low Priority',    value: stats.low,        bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
            { label: 'Total Alerts',    value: stats.total,      bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
            { label: 'Resolved',        value: stats.resolved,   bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
            { label: 'Active',          value: stats.unresolved, bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
          ].map((s, i) => (
            <motion.div 
              key={s.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl p-5 border ${s.border} ${s.bg} backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]`}
            >
              <div className="relative z-10">
                <p className={`${s.text} text-xs font-bold uppercase tracking-wider mb-1`}>{s.label}</p>
                <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full ${s.bg} blur-xl`}></div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-xl flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Failed to load live data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ── Search & Filter ── */}
        <motion.div 
          className="bg-gray-800/40 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/5 shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search alerts by title, description, or source…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">⚡ All Severities</option>
              <option value="high">🔴 High Only</option>
              <option value="medium">🟡 Medium Only</option>
              <option value="low">🔵 Low Only</option>
            </select>
          </div>

          {/* Summary row */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-gray-400">
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <AlertTriangle className="h-3.5 w-3.5 text-violet-400" />
              <span>Showing <strong className="text-white">{filteredAlerts.length}</strong> of {stats.total} alerts</span>
            </span>
            {stats.resolved > 0 && (
              <span className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span><strong className="text-emerald-400">{stats.resolved}</strong> resolved</span>
              </span>
            )}
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Auto-refreshes every 30s</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Community reports included</span>
            </span>
          </div>
        </motion.div>

        {/* ── Alerts List ── */}
        {loading && alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-white text-xl font-bold tracking-tight">Initializing Dashboard</p>
            <p className="text-gray-400 mt-2 font-medium">Establishing secure connection to core systems...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-gray-800/30 rounded-3xl border border-white/5 backdrop-blur-sm"
          >
            <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-gray-500" />
            </div>
            <p className="text-white text-2xl font-bold tracking-tight mb-2">
              {alerts.length === 0 ? 'Systems Nominal' : 'No matches found'}
            </p>
            <p className="text-gray-400">
              {alerts.length === 0
                ? 'No active alerts detected in the monitoring region.'
                : 'Try adjusting your search parameters or filter settings.'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {filteredAlerts.map(alert => (
              <motion.div
                key={alert._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
              >
                <AdminAlertCard
                  alert={alert}
                  onResolve={handleResolve}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
