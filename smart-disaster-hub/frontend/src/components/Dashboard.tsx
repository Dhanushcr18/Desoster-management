import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapView from './MapView';
import ReportModal from './ReportModal';
import AlertDetailsModal from './AlertDetailsModal';
import EmergencyContacts from './EmergencyContacts';
import ToastContainer from './ToastContainer';
import { alertsAPI } from '../services/api';
import socketService from '../services/socket';
import { realWeatherService, WeatherAlert } from '../services/realWeatherService';
import type { Alert, AlertWithStats } from '../types';
import { 
  Shield, 
  LogOut, 
  Bell, 
  Filter, 
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Menu,
  X,
  Zap,
  Phone,
  Home as HomeIcon,
  Heart,
  Pill,
  UtensilsCrossed,
  ChevronDown
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertWithStats[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>>([]);
  const [newAlertCount, setNewAlertCount] = useState(0);
  const [realWorldAlerts, setRealWorldAlerts] = useState<WeatherAlert[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState<'shelter' | 'medications' | 'food' | null>(null);

  useEffect(() => {
    loadAlerts();
    loadRealWorldData();
    setupSocketListeners();

    // Refresh real-world data every 5 minutes
    const realDataInterval = setInterval(loadRealWorldData, 5 * 60 * 1000);

    // Close help menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showHelpMenu && !target.closest('.help-menu-container')) {
        setShowHelpMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      socketService.offNewAlert();
      socketService.offReportUpdate();
      clearInterval(realDataInterval);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showHelpMenu]);

  const loadAlerts = async () => {
    try {
      const data = await alertsAPI.getAll();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealWorldData = async () => {
    setLoadingRealData(true);
    try {
      const realAlerts = await realWeatherService.getAllAlerts();
      const previousCount = realWorldAlerts.length;
      setRealWorldAlerts(realAlerts);
      
      // Show notifications for new real-world alerts
      if (previousCount > 0 && realAlerts.length > previousCount) {
        const newAlerts = realAlerts.slice(0, realAlerts.length - previousCount);
        newAlerts.forEach(alert => {
          showToast({
            id: `real-${alert.id}`,
            title: `🌍 Real-World Alert: ${alert.alertType.toUpperCase()}`,
            message: alert.title,
            type: alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'
          });
        });
        setNewAlertCount(prev => prev + newAlerts.length);
        playNotificationSound();
      }

      console.log(`Loaded ${realAlerts.length} real-world alerts`);
    } catch (error) {
      console.error('Failed to load real-world data:', error);
    } finally {
      setLoadingRealData(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.joinAlertsRoom();

    // Listen for new alerts
    socketService.onNewAlert((alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setNewAlertCount(prev => prev + 1);
      
      // Show real-time notification
      showToast({
        id: `alert-${alert._id}-${Date.now()}`,
        title: `🚨 New ${alert.severity.toUpperCase()} Alert!`,
        message: `${alert.title} - ${alert.description.substring(0, 100)}...`,
        type: alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'
      });

      // Play notification sound
      playNotificationSound();
    });

    // Listen for new community-reported alerts
    socketService.onNewAlert((newAlert) => {
      console.log('New alert received:', newAlert);
      
      // Add to alerts list
      setAlerts((prev) => [newAlert, ...prev]);
      
      // Show notification
      showToast({
        id: `new-alert-${newAlert._id}`,
        title: `🚨 New Report: ${newAlert.title}`,
        message: newAlert.description.substring(0, 100) + '...',
        type: newAlert.severity === 'high' ? 'error' : 'warning'
      });
      
      // Play notification sound
      playNotificationSound();
    });

    // Listen for report updates
    socketService.onReportUpdate((data) => {
      console.log('📊 Report update received:', data);
      
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === data.alertId
            ? { ...alert, reportStats: data.reportStats }
            : alert
        )
      );

      // Update selected alert if it matches
      if (selectedAlert?._id === data.alertId) {
        console.log('✅ Updating selected alert stats');
        setSelectedAlert((prev) =>
          prev ? { ...prev, reportStats: data.reportStats } : null
        );
      }

      // Show update notification
      const totalReports = (data.reportStats?.safe || 0) + (data.reportStats?.help || 0);
      if (totalReports > 0) {
        showToast({
          id: `report-${data.alertId}-${Date.now()}`,
          title: '📊 Community Update',
          message: `${data.reportStats?.safe || 0} safe, ${data.reportStats?.help || 0} need help`,
          type: 'info'
        });
      }
    });
  };

  const showToast = (toast: { id: string; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleAlertClick = async (alert: any) => {
    setSelectedAlert(alert);
    
    // Try to load full details for database alerts
    if (!alert.alertType) {
      try {
        const data = await alertsAPI.getById(alert._id);
        setSelectedAlert(data.alert);
      } catch (error) {
        console.error('Failed to load alert details:', error);
      }
    }
    
    // Always show details modal first
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = () => {
    setShowDetailsModal(false);
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);
    showToast({
      id: `success-${Date.now()}`,
      title: '✅ Report Submitted',
      message: 'Your status has been updated successfully',
      type: 'success'
    });
  };

  // Test function to simulate new alert (for demo purposes)
  const simulateNewAlert = () => {
    const testAlert: any = {
      _id: `test-${Date.now()}`,
      title: 'Flash Flood Warning',
      description: 'Heavy rainfall causing flash flooding in downtown area. Avoid low-lying areas and seek higher ground immediately.',
      severity: Math.random() > 0.5 ? 'high' : 'medium',
      geometry: {
        type: 'Point',
        coordinates: [-122.4194 + (Math.random() - 0.5) * 0.1, 37.7749 + (Math.random() - 0.5) * 0.1]
      },
      source: 'Weather Service',
      createdAt: new Date().toISOString()
    };
    
    setAlerts((prev) => [testAlert, ...prev]);
    setNewAlertCount(prev => prev + 1);
    
    showToast({
      id: `alert-${testAlert._id}`,
      title: `🚨 New ${testAlert.severity.toUpperCase()} Alert!`,
      message: `${testAlert.title} - ${testAlert.description.substring(0, 80)}...`,
      type: testAlert.severity === 'high' ? 'error' : 'warning'
    });
    
    playNotificationSound();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Combine database alerts with real-world alerts
  const allAlerts: any[] = [...alerts, ...realWorldAlerts.map(ra => ({
    ...ra,
    _id: ra.id,
    source: ra.source,
    createdAt: ra.createdAt,
    verified: false // Real-world alerts are auto-verified
  }))];

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const stats = {
    critical: allAlerts.filter(a => a.severity === 'high').length, // treating high as critical
    high: allAlerts.filter(a => a.severity === 'high').length,
    medium: allAlerts.filter(a => a.severity === 'medium').length,
    low: allAlerts.filter(a => a.severity === 'low').length,
    realWorld: realWorldAlerts.length,
    database: alerts.length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-700 text-xl font-semibold">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DisasterAlert</h1>
                  <p className="text-xs text-gray-500">Real-time Monitoring</p>
                </div>
              </Link>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right: User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Emergency Contacts Button */}
              <button
                onClick={() => setShowEmergencyContacts(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-bold"
                title="Emergency Contacts Worldwide"
              >
                <Phone className="h-5 w-5 animate-pulse" />
                <span className="hidden lg:inline">SOS</span>
              </button>

              {/* Notification Badge */}
              {newAlertCount > 0 && (
                <div className="relative">
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {newAlertCount}
                  </div>
                  <button
                    onClick={() => setNewAlertCount(0)}
                    className="p-2 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              <Link
                to="/contact"
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition"
              >
                <Zap className="h-4 w-4" />
                <span className="font-medium">Report Disaster</span>
              </Link>
              
              {/* Real-World Data Refresh Button */}
              <button
                onClick={loadRealWorldData}
                disabled={loadingRealData}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                title="Fetch real-world disaster data"
              >
                <TrendingUp className={`h-4 w-4 ${loadingRealData ? 'animate-spin' : ''}`} />
                <span className="font-medium">
                  {loadingRealData ? 'Loading...' : `Real Data (${stats.realWorld})`}
                </span>
              </button>
              
              {/* Test Alert Button (Development) */}
              <button
                onClick={simulateNewAlert}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
                title="Simulate new disaster alert"
              >
                <Bell className="h-4 w-4 animate-bounce" />
                <span className="font-medium">Test</span>
              </button>

              {/* Help Menu */}
              <div className="relative help-menu-container">
                <button
                  onClick={() => setShowHelpMenu(!showHelpMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition"
                >
                  <Heart className="h-4 w-4" />
                  <span className="font-medium">Help</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showHelpMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Help Dropdown Menu */}
                {showHelpMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden z-50 animate-slide-down">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
                      <h3 className="text-white font-bold text-lg">Emergency Resources</h3>
                      <p className="text-white/80 text-xs">Quick access to help</p>
                    </div>
                    
                    <div className="p-2">
                      {/* Safe Shelter */}
                      <button
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 rounded-lg transition group"
                        onClick={() => {
                          setShowHelpModal('shelter');
                          setShowHelpMenu(false);
                        }}
                      >
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg group-hover:scale-110 transition">
                          <HomeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 text-sm">Safe Shelter</p>
                          <p className="text-xs text-gray-500">Find nearby shelters</p>
                        </div>
                      </button>

                      {/* Medications */}
                      <button
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 rounded-lg transition group"
                        onClick={() => {
                          setShowHelpModal('medications');
                          setShowHelpMenu(false);
                        }}
                      >
                        <div className="bg-gradient-to-br from-red-500 to-pink-500 p-2 rounded-lg group-hover:scale-110 transition">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 text-sm">Medications</p>
                          <p className="text-xs text-gray-500">Emergency medical aid</p>
                        </div>
                      </button>

                      {/* Food Resources */}
                      <button
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 rounded-lg transition group"
                        onClick={() => {
                          setShowHelpModal('food');
                          setShowHelpMenu(false);
                        }}
                      >
                        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-2 rounded-lg group-hover:scale-110 transition">
                          <UtensilsCrossed className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 text-sm">Food Resources</p>
                          <p className="text-xs text-gray-500">Food banks & supplies</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3 border-l pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Stats Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Live Monitoring Indicator */}
            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700">Live: {stats.realWorld} Real-World</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-semibold text-gray-700">
                {stats.critical + stats.high} High Priority
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm font-semibold text-gray-700">
                {stats.medium} Medium Priority
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-semibold text-gray-700">
                {stats.low} Low Priority
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          <div className="h-full bg-white border-r shadow-lg overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Alerts</h2>
              
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No active alerts</p>
                  <p className="text-sm text-gray-400 mt-2">You're all clear! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert._id}
                      onClick={() => handleAlertClick(alert)}
                      className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-l-4 hover:shadow-xl transition-all duration-200"
                      style={{ borderLeftColor: getSeverityColor(alert.severity).replace('bg-', '#') }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`${getSeverityColor(alert.severity)} p-2 rounded-lg text-white`}>
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition">
                              {alert.title}
                            </h3>
                            <span className={`text-xs font-semibold uppercase ${getSeverityColor(alert.severity).replace('bg-', 'text-')}`}>
                              {alert.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {alert.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{alert.source || 'Official'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {alert.reportStats && (
                        <div className="mt-3 pt-3 border-t flex items-center space-x-4">
                          <div className="flex items-center space-x-1 text-emerald-600">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-semibold">{alert.reportStats.safe || 0} Safe</span>
                          </div>
                          <div className="flex items-center space-x-1 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-semibold">{alert.reportStats.help || 0} Need Help</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
          <MapView alerts={filteredAlerts} onAlertClick={handleAlertClick} />
          
          {/* Toggle Sidebar Button (Mobile) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition z-10"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedAlert && (
        <ReportModal
          alert={selectedAlert}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}

      {/* Alert Details Modal */}
      {showDetailsModal && selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setShowDetailsModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Emergency Contacts Modal */}
      {showEmergencyContacts && (
        <EmergencyContacts
          onClose={() => setShowEmergencyContacts(false)}
        />
      )}

      {/* Help Modals */}
      {showHelpModal === 'shelter' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelpModal(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <HomeIcon className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Safe Shelter Information</h2>
                    <p className="text-blue-100">Find emergency shelters near you</p>
                  </div>
                </div>
                <button onClick={() => setShowHelpModal(null)} className="text-white hover:text-blue-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-900 mb-2">🏠 Emergency Shelters</h3>
                <p className="text-gray-700">During disasters, temporary shelters provide safe refuge for affected people.</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Types of Shelters:</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🏫 School Buildings</h4>
                  <p className="text-gray-600">Public schools often serve as emergency shelters with large spaces and facilities.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🏛️ Community Centers</h4>
                  <p className="text-gray-600">Local community halls and centers provide temporary accommodation during emergencies.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">⛪ Religious Buildings</h4>
                  <p className="text-gray-600">Temples, churches, and mosques often open their doors during disasters.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🏟️ Sports Stadiums</h4>
                  <p className="text-gray-600">Large stadiums can accommodate many people in emergency situations.</p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ What to Bring to Shelter:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Identification documents</li>
                  <li>Medications and medical records</li>
                  <li>Water and non-perishable food</li>
                  <li>Blankets and warm clothing</li>
                  <li>Mobile phone and charger</li>
                  <li>Emergency cash</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-green-900 mb-2">📞 Find Shelter Near You:</h3>
                <p className="text-gray-700 mb-2">Contact local authorities:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Emergency Services: 108 / 112</li>
                  <li>NDRF Helpline: 011-24363260</li>
                  <li>Local Municipal Office</li>
                  <li>Police Control Room: 100</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelpModal === 'medications' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelpModal(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Pill className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Emergency Medications</h2>
                    <p className="text-red-100">Essential medical supplies information</p>
                  </div>
                </div>
                <button onClick={() => setShowHelpModal(null)} className="text-white hover:text-red-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-bold text-red-900 mb-2">💊 Emergency First Aid Kit</h3>
                <p className="text-gray-700">Every household should maintain a basic first aid kit for emergencies.</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Essential Medications:</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🩹 Basic Supplies</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Bandages and gauze</li>
                    <li>Antiseptic solution (Dettol, Betadine)</li>
                    <li>Cotton and medical tape</li>
                    <li>Scissors and tweezers</li>
                    <li>Disposable gloves</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">💊 Common Medicines</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Paracetamol (fever, pain)</li>
                    <li>ORS packets (dehydration)</li>
                    <li>Antibiotic ointment</li>
                    <li>Anti-diarrheal medicine</li>
                    <li>Antihistamine (allergies)</li>
                    <li>Pain relief spray</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🏥 Prescription Medications</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Keep at least 7-day supply</li>
                    <li>Diabetes medication/insulin</li>
                    <li>Blood pressure medicine</li>
                    <li>Heart medication</li>
                    <li>Asthma inhalers</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ Important Reminders:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Check expiry dates regularly</li>
                  <li>Store in waterproof container</li>
                  <li>Keep medications in original packaging</li>
                  <li>Include written instructions</li>
                  <li>Have backup prescription copies</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-green-900 mb-2">📞 Emergency Medical Help:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Ambulance: 102 / 108</li>
                  <li>Medical Emergency: 112</li>
                  <li>Poison Control: 1800-116-117</li>
                  <li>Blood Bank: 104</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelpModal === 'food' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelpModal(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UtensilsCrossed className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Food Resources</h2>
                    <p className="text-orange-100">Emergency food supplies and assistance</p>
                  </div>
                </div>
                <button onClick={() => setShowHelpModal(null)} className="text-white hover:text-orange-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <h3 className="font-bold text-orange-900 mb-2">🍲 Emergency Food Supplies</h3>
                <p className="text-gray-700">Essential items to store for disaster preparedness.</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Non-Perishable Foods:</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🥫 Canned Foods</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Canned vegetables and fruits</li>
                    <li>Canned beans and lentils</li>
                    <li>Canned fish (tuna, sardines)</li>
                    <li>Canned soups</li>
                    <li>Shelf life: 2-5 years</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🍚 Dry Goods</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Rice, wheat, and pasta</li>
                    <li>Dal (lentils) - toor, moong, chana</li>
                    <li>Dry fruits and nuts</li>
                    <li>Biscuits and crackers</li>
                    <li>Instant noodles</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">💧 Water & Beverages</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Bottled water (1 gallon/person/day)</li>
                    <li>Water purification tablets</li>
                    <li>Juice boxes</li>
                    <li>Instant coffee/tea</li>
                    <li>ORS packets</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">🍪 Ready-to-Eat Items</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Energy bars and protein bars</li>
                    <li>Peanut butter</li>
                    <li>Honey and jam</li>
                    <li>Instant oatmeal</li>
                    <li>Powdered milk</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-bold text-yellow-900 mb-2">⚠️ Food Safety Tips:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Store food in cool, dry place</li>
                  <li>Rotate stock regularly (FIFO method)</li>
                  <li>Keep at least 3-day supply per person</li>
                  <li>Include manual can opener</li>
                  <li>Check expiry dates monthly</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-green-900 mb-2">📞 Food Assistance:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Local Food Banks & NGOs</li>
                  <li>Government Relief Centers</li>
                  <li>Ration Distribution Centers</li>
                  <li>Community Kitchens (Langar)</li>
                  <li>Red Cross Food Services</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-900 mb-2">🆘 Emergency Helplines:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Disaster Management: 1078</li>
                  <li>Women Helpline: 1091</li>
                  <li>Child Helpline: 1098</li>
                  <li>Senior Citizens: 14567</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
