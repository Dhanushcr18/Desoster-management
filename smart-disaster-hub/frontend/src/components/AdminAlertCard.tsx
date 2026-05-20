import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from '../utils/date';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail,
  Globe,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Navigation,
  CheckCircle
} from 'lucide-react';
import type { AlertWithStats } from '../types';

interface AdminAlertCardProps {
  alert: AlertWithStats;
  onResolve?: () => void;
}

const getEmergencyContacts = (coordinates: [number, number]) => {
  const [lng, lat] = coordinates;
  
  // India
  if (lat >= 8 && lat <= 35 && lng >= 68 && lng <= 97) {
    return {
      country: 'India',
      flag: '🇮🇳',
      police: '100',
      fire: '101',
      ambulance: '102',
      disaster: '1078',
      email: 'disaster@ndma.gov.in'
    };
  }
  
  // USA
  if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
    return {
      country: 'United States',
      flag: '🇺🇸',
      police: '911',
      fire: '911',
      ambulance: '911',
      disaster: '1-800-621-3362',
      email: 'fema@dhs.gov'
    };
  }
  
  // UK
  if (lat >= 50 && lat <= 59 && lng >= -8 && lng <= 2) {
    return {
      country: 'United Kingdom',
      flag: '🇬🇧',
      police: '999',
      fire: '999',
      ambulance: '999',
      disaster: '0800-107-0059',
      email: 'enquiries@cabinetoffice.gov.uk'
    };
  }
  
  // Default fallback
  return {
    country: 'International',
    flag: '🌍',
    police: '112',
    fire: '112',
    ambulance: '112',
    disaster: '112',
    email: 'emergency@local.gov'
  };
};

export default function AdminAlertCard({ alert, onResolve }: AdminAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isResolved, setIsResolved] = useState(alert.resolved || false);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const emergencyContacts = getEmergencyContacts(alert.geometry.coordinates);
  
  useEffect(() => {
    if (expanded && !isResolved) {
      const fetchReports = async () => {
        setLoadingReports(true);
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const res = await fetch(`${apiUrl}/api/alerts/${alert._id || (alert as any).id}/location-reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setReports(data.reports || []);
          }
        } catch (err) {
          console.error('Failed to fetch reports:', err);
        } finally {
          setLoadingReports(false);
        }
      };
      fetchReports();
    }
  }, [expanded, alert._id, (alert as any).id, isResolved]);
  
  const handleMarkResolved = async () => {
    if (window.confirm('Mark this disaster as resolved? This action cannot be undone.')) {
      setIsResolving(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/alerts/${alert._id || (alert as any).id}/resolve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to mark as resolved');
        }

        setIsResolved(true);
        if (onResolve) {
          onResolve();
        }
      } catch (error) {
        console.error('Failed to mark as resolved:', error);
        window.alert('Failed to mark as resolved. Please try again.');
      } finally {
        setIsResolving(false);
      }
    }
  };
  
  const getSeverityBorder = () => {
    switch (alert.severity) {
      case 'high': return 'border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)]';
      case 'medium': return 'border-l-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]';
      case 'low': return 'border-l-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]';
      default: return 'border-l-gray-500';
    }
  };

  const getSeverityText = () => {
    switch (alert.severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <div className={`bg-gray-800/40 backdrop-blur-md rounded-2xl border-y border-r border-white/5 border-l-[6px] ${
        isResolved ? 'border-l-emerald-500 bg-emerald-900/10' : getSeverityBorder()
      } overflow-hidden transition-all duration-300 hover:bg-gray-800/60 group ${
        isResolved ? 'opacity-75' : ''
      }`}>
        {/* Resolved Banner */}
        {isResolved && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 border-b-2 border-green-500">
            <div className="flex items-center justify-center space-x-2 text-white">
              <span className="text-xl animate-bounce">✅</span>
              <span className="font-black text-lg">ISSUE RESOLVED</span>
              <span className="text-xl animate-bounce">✅</span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div 
          className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border bg-black/20 ${getSeverityText()} ${
                alert.severity === 'high' ? 'border-red-500/30' : 
                alert.severity === 'medium' ? 'border-amber-500/30' : 
                'border-cyan-500/30'
              }`}>
                {alert.severity} Priority
              </span>
              {alert.photos && alert.photos.length > 0 && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center space-x-1">
                  <ImageIcon className="h-3 w-3 text-pink-400" />
                  <span>{alert.photos.length} Photo{alert.photos.length !== 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">{alert.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-medium">
              <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDistanceToNow(alert.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{alert.source}</span>
              </div>
            </div>
          </div>
          <button
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 self-start sm:self-center"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="h-6 w-6 text-gray-300" />
            </motion.div>
          </button>
        </div>

        {/* Content (Animated Expansion) */}
        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-white/5"
            >
              <div className="p-5 sm:p-6 space-y-8 bg-black/20">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span>Description</span>
                  </h4>
                  <p className="text-gray-200 leading-relaxed text-lg">{alert.description}</p>
                </div>

                {/* Location & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Navigation className="h-24 w-24" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Coordinates</h4>
                    <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center bg-black/30 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-sm font-medium">Latitude</span>
                        <span className="text-gray-100 font-mono text-sm">{alert.geometry.coordinates[1].toFixed(4)}°</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/30 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-sm font-medium">Longitude</span>
                        <span className="text-gray-100 font-mono text-sm">{alert.geometry.coordinates[0].toFixed(4)}°</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${alert.geometry.coordinates[1]},${alert.geometry.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-xl transition-all text-sm font-bold w-full relative z-10"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>View on Maps</span>
                    </a>
                  </div>

                  {/* Community Stats */}
                  {alert.reportStats && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Community Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                          <p className="text-3xl font-black text-emerald-400 mb-1">{alert.reportStats.safe || 0}</p>
                          <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest">Safe</p>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                          <p className="text-3xl font-black text-orange-400 mb-1">{alert.reportStats.help || 0}</p>
                          <p className="text-xs font-bold text-orange-500/70 uppercase tracking-widest">Need Help</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos Grid */}
                {alert.photos && alert.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span>Disaster Photos ({alert.photos.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {alert.photos.map((photo, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedPhoto(photo)}
                          className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-violet-500/50 transition-all duration-300"
                        >
                          <img
                            src={photo}
                            alt={`Disaster evidence ${index + 1}`}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <ImageIcon className="h-5 w-5 text-white mb-1" />
                            <p className="text-xs font-bold text-white">View Image</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts - Only show when expanded */}
                <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Phone className="h-24 w-24" />
                  </div>
                  <h4 className="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider flex items-center space-x-2">
                    <Phone className="h-4 w-4 animate-pulse" />
                    <span>Emergency Contacts - {emergencyContacts.country} {emergencyContacts.flag}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 relative z-10">
                    <a
                      href={`tel:${emergencyContacts.police}`}
                      className="bg-black/30 hover:bg-black/50 border border-white/5 text-white rounded-xl p-4 text-center transition group hover:border-red-500/50"
                    >
                      <div className="text-2xl mb-1">🚓</div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Police</p>
                      <p className="text-lg font-bold group-hover:text-red-400 transition-colors">{emergencyContacts.police}</p>
                    </a>
                    
                    <a
                      href={`tel:${emergencyContacts.fire}`}
                      className="bg-black/30 hover:bg-black/50 border border-white/5 text-white rounded-xl p-4 text-center transition group hover:border-red-500/50"
                    >
                      <div className="text-2xl mb-1">🚒</div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Fire</p>
                      <p className="text-lg font-bold group-hover:text-red-400 transition-colors">{emergencyContacts.fire}</p>
                    </a>
                    
                    <a
                      href={`tel:${emergencyContacts.ambulance}`}
                      className="bg-black/30 hover:bg-black/50 border border-white/5 text-white rounded-xl p-4 text-center transition group hover:border-red-500/50"
                    >
                      <div className="text-2xl mb-1">🚑</div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Ambulance</p>
                      <p className="text-lg font-bold group-hover:text-red-400 transition-colors">{emergencyContacts.ambulance}</p>
                    </a>
                    
                    <a
                      href={`tel:${emergencyContacts.disaster}`}
                      className="bg-black/30 hover:bg-black/50 border border-white/5 text-white rounded-xl p-4 text-center transition group hover:border-red-500/50"
                    >
                      <div className="text-2xl mb-1">⚠️</div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase">Disaster Mgmt</p>
                      <p className="text-sm font-bold group-hover:text-red-400 transition-colors">{emergencyContacts.disaster}</p>
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                    <a
                      href={`mailto:${emergencyContacts.email}?subject=Emergency Report: ${alert.title}&body=Location: ${alert.geometry.coordinates[1]}, ${alert.geometry.coordinates[0]}%0D%0A%0D%0ADescription: ${alert.description}`}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                    >
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-sm">Email Report</span>
                    </a>
                    
                    <a
                      href={`https://www.google.com/maps?q=${alert.geometry.coordinates[1]},${alert.geometry.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
                    >
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-sm">Share Location</span>
                    </a>
                  </div>
                </div>

                {/* Affected Individuals / Contact Info */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Affected Individuals & Contacts</span>
                  </h4>
                  
                  {loadingReports ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-6 bg-black/20 rounded-xl border border-white/5">
                      <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No contact information reported yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report, idx) => (
                        <div key={report.id || idx} className="bg-black/30 rounded-xl p-4 border border-white/5 hover:border-violet-500/30 transition-all">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                            <div>
                              <p className="font-bold text-white">
                                {report.contactName || report.User?.name || 'Anonymous User'}
                              </p>
                              <div className="flex flex-wrap items-center text-xs text-gray-400 mt-1 gap-3">
                                {report.contactPhone && (
                                  <a href={`tel:${report.contactPhone}`} className="flex items-center space-x-1 hover:text-white transition-colors">
                                    <Phone className="h-3 w-3" />
                                    <span>{report.contactPhone}</span>
                                  </a>
                                )}
                                {report.User?.email && (
                                  <a href={`mailto:${report.User.email}`} className="flex items-center space-x-1 hover:text-white transition-colors">
                                    <Mail className="h-3 w-3" />
                                    <span>{report.User.email}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                              report.status === 'safe' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {report.status === 'safe' ? 'Reported Safe' : 'Needs Help'}
                            </span>
                          </div>
                          
                          {(report.contactLocation || report.address) && (
                            <div className="flex items-start space-x-2 text-sm text-gray-300 mt-3 bg-white/5 p-3 rounded-lg border border-white/5">
                              <MapPin className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-relaxed">{report.contactLocation || report.address}</span>
                            </div>
                          )}
                          
                          {report.note && (
                            <div className="mt-3 text-sm text-gray-400 italic bg-black/20 p-3 rounded-lg border-l-2 border-l-gray-600">
                              "{report.note}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mark as Resolved Button */}
                {!isResolved ? (
                  <button
                    onClick={handleMarkResolved}
                    disabled={isResolving}
                    className={`w-full flex items-center justify-center space-x-3 px-6 py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      isResolving
                        ? 'bg-white/5 cursor-not-allowed opacity-50 border border-white/10'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {isResolving ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                        <span>Updating Status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6" />
                        <span>MARK ISSUE AS RESOLVED</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center space-x-3 px-6 py-5 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold text-lg">
                    <span className="text-2xl">✅</span>
                    <span>Issue Resolved - Emergency Response Completed</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-6xl max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-14 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm px-4 py-2 rounded-xl transition-all">
                  <span className="text-lg">✕</span>
                  <span className="font-semibold text-sm">Close</span>
                </div>
              </button>
              <img
                src={selectedPhoto}
                alt="Disaster evidence"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
