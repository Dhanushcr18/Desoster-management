import React, { useState } from 'react';
import { formatDistanceToNow } from '../utils/date';
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
  TrendingUp,
  Navigation
} from 'lucide-react';
import type { AlertWithStats } from '../types';

interface AdminAlertCardProps {
  alert: AlertWithStats;
  onResolve?: () => void;
}

// Emergency contacts mapping by country/region
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
  
  const emergencyContacts = getEmergencyContacts(alert.geometry.coordinates);
  
  const handleMarkResolved = async () => {
    if (window.confirm('Mark this disaster as resolved? This action cannot be undone.')) {
      setIsResolving(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/alerts/${alert._id}/resolve`, {
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
  
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getSeverityBg = () => {
    switch (alert.severity) {
      case 'high': return 'bg-red-500/10 border-red-500';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500';
      case 'low': return 'bg-blue-500/10 border-blue-500';
      default: return 'bg-gray-500/10 border-gray-500';
    }
  };

  const getSeverityText = () => {
    switch (alert.severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <div className={`bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-2xl border-2 ${
        isResolved ? 'border-green-500 bg-green-900/20' : getSeverityBg()
      } overflow-hidden transition-all duration-300 hover:shadow-3xl hover:scale-[1.01] ${
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

        {/* Header */}
        <div className={`bg-gradient-to-r ${getSeverityColor()} p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase">
                  {alert.severity} Priority
                </span>
                {alert.photos && alert.photos.length > 0 && (
                  <span className="px-3 py-1 bg-pink-500/80 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center space-x-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>{alert.photos.length} Photo{alert.photos.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{alert.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(alert.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{alert.source}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              {expanded ? (
                <ChevronUp className="h-6 w-6 text-white" />
              ) : (
                <ChevronDown className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <span>Description</span>
            </h4>
            <p className="text-gray-300 leading-relaxed">{alert.description}</p>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Location Coordinates</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Latitude:</span>
                  <span className="text-white font-mono">{alert.geometry.coordinates[1].toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Longitude:</span>
                  <span className="text-white font-mono">{alert.geometry.coordinates[0].toFixed(4)}°</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${alert.geometry.coordinates[1]},${alert.geometry.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-semibold"
              >
                <Navigation className="h-4 w-4" />
                <span>View on Map</span>
              </a>
            </div>

            {/* Community Stats */}
            {alert.reportStats && (
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <h4 className="text-sm font-bold text-gray-400 mb-3">Community Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{alert.reportStats.safe || 0}</p>
                    <p className="text-xs text-emerald-300">Safe</p>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-400">{alert.reportStats.help || 0}</p>
                    <p className="text-xs text-orange-300">Need Help</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photos Grid */}
          {alert.photos && alert.photos.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-pink-400" />
                <span>Disaster Photos ({alert.photos.length})</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {alert.photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-gray-700 hover:border-pink-500 transition-all duration-300 transform hover:scale-105"
                  >
                    <img
                      src={photo}
                      alt={`Disaster evidence ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white text-center">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs font-bold">View Full Size</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contacts - Only show when expanded */}
          {expanded && (
            <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl p-5 border-2 border-red-500/50">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <Phone className="h-5 w-5 text-red-400 animate-pulse" />
                <span>Emergency Contacts - {emergencyContacts.country} {emergencyContacts.flag}</span>
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <a
                  href={`tel:${emergencyContacts.police}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 text-center transition group"
                >
                  <div className="text-2xl mb-1">🚓</div>
                  <p className="text-xs font-semibold mb-1">Police</p>
                  <p className="text-lg font-bold group-hover:scale-110 transition-transform">{emergencyContacts.police}</p>
                </a>
                
                <a
                  href={`tel:${emergencyContacts.fire}`}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 text-center transition group"
                >
                  <div className="text-2xl mb-1">🚒</div>
                  <p className="text-xs font-semibold mb-1">Fire</p>
                  <p className="text-lg font-bold group-hover:scale-110 transition-transform">{emergencyContacts.fire}</p>
                </a>
                
                <a
                  href={`tel:${emergencyContacts.ambulance}`}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 text-center transition group"
                >
                  <div className="text-2xl mb-1">🚑</div>
                  <p className="text-xs font-semibold mb-1">Ambulance</p>
                  <p className="text-lg font-bold group-hover:scale-110 transition-transform">{emergencyContacts.ambulance}</p>
                </a>
                
                <a
                  href={`tel:${emergencyContacts.disaster}`}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 text-center transition group"
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  <p className="text-xs font-semibold mb-1">Disaster Mgmt</p>
                  <p className="text-sm font-bold group-hover:scale-110 transition-transform">{emergencyContacts.disaster}</p>
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <a
                  href={`mailto:${emergencyContacts.email}?subject=Emergency Report: ${alert.title}&body=Location: ${alert.geometry.coordinates[1]}, ${alert.geometry.coordinates[0]}%0D%0A%0D%0ADescription: ${alert.description}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Email Report</span>
                </a>
                
                <a
                  href={`https://www.google.com/maps?q=${alert.geometry.coordinates[1]},${alert.geometry.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  <Globe className="h-5 w-5" />
                  <span className="font-semibold">Share Location</span>
                </a>
              </div>

              {/* Mark as Resolved Button */}
              {!isResolved ? (
                <button
                  onClick={handleMarkResolved}
                  disabled={isResolving}
                  className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                    isResolving
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105'
                  } text-white border-2 border-green-500/50`}
                >
                  {isResolving ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Marking as Resolved...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">✅</span>
                      <span>Mark Issue as RESOLVED</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-bold text-lg border-2 border-green-500">
                  <span className="text-2xl animate-bounce">✅</span>
                  <span>Issue RESOLVED - Emergency Response Completed</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-lg">✕</span>
                <span className="font-semibold">Close</span>
              </div>
            </button>
            <img
              src={selectedPhoto}
              alt="Disaster evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
