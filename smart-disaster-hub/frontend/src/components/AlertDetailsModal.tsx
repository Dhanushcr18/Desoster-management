import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, AlertTriangle, Info, TrendingUp, Users } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';
import LocationReports from './LocationReports';
import axios from 'axios';

interface AlertDetailsModalProps {
  alert: any;
  onClose: () => void;
  onUpdateStatus?: () => void;
}

export default function AlertDetailsModal({ alert, onClose, onUpdateStatus }: AlertDetailsModalProps) {
  const [locationReports, setLocationReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    // Only fetch location reports for database alerts (not real-world alerts)
    if (alert._id && !alert.alertType) {
      fetchLocationReports();
    }
  }, [alert._id]);

  const fetchLocationReports = async () => {
    try {
      setLoadingReports(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/alerts/${alert._id}/location-reports`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLocationReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch location reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${
          alert.severity === 'high' ? 'from-red-500 to-orange-500' :
          alert.severity === 'medium' ? 'from-yellow-500 to-orange-500' :
          'from-blue-500 to-cyan-500'
        } text-white p-6 rounded-t-2xl`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">
                  {alert.severity} Priority
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                  {alert.alertType || 'General'}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{alert.title}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(alert.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{alert.source || 'Official Source'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span>Description</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">{alert.description}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span>Location</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Latitude</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {alert.geometry?.coordinates[1]?.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Longitude</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {alert.geometry?.coordinates[0]?.toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <span>Additional Details</span>
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 space-y-2">
                {Object.entries(alert.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      {key === 'magnitude' && ' Richter'}
                      {key === 'temperature' && ' °C'}
                      {key === 'windSpeed' && ' km/h'}
                      {key === 'depth' && ' km'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Stats */}
          {alert.reportStats && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-500" />
                <span>Community Status</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {alert.reportStats.safe || 0}
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">People Safe</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {alert.reportStats.help || 0}
                  </p>
                  <p className="text-sm text-orange-700 font-medium">Need Help</p>
                </div>
              </div>

              {/* Safe Radius Information */}
              {alert.reportStats.safeRadius && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Safe Distance from Disaster Area</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {alert.reportStats.safeRadius.average} km
                      </p>
                      <p className="text-xs text-blue-700">Average Safe Radius</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-blue-600">
                        {alert.reportStats.safeRadius.min} - {alert.reportStats.safeRadius.max} km
                      </p>
                      <p className="text-xs text-blue-700">Reported Range</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {alert.reportStats.safeRadius.reportCount}
                      </p>
                      <p className="text-xs text-blue-700">Reports with Data</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    💡 Based on community reports from people in the affected area
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Community Location & Route Reports */}
          {!alert.alertType && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <span>Community Location & Route Reports</span>
                {loadingReports && <span className="text-sm text-gray-500">(Loading...)</span>}
              </h3>
              <LocationReports reports={locationReports} />
            </div>
          )}

          {/* Safety Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">⚠️ Safety Recommendations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Stay informed through official channels</li>
              <li>• Follow local authority instructions</li>
              <li>• Keep emergency supplies ready</li>
              <li>• Stay in touch with family and friends</li>
              {alert.severity === 'high' && <li className="font-bold">• Seek immediate shelter if advised</li>}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Update Status Button - Only for community alerts */}
            {!alert.alertType && onUpdateStatus && (
              <button
                onClick={() => {
                  onClose();
                  onUpdateStatus();
                }}
                className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>Update My Status</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`${!alert.alertType && onUpdateStatus ? 'sm:flex-none sm:px-8' : 'flex-1'} py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 hover:shadow-lg transition-all duration-300`}
            >
              Close
            </button>
            
            {alert.metadata?.url && (
              <a
                href={alert.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-none py-3 sm:py-4 px-6 bg-blue-500 text-white rounded-xl font-semibold text-center hover:bg-blue-600 hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Info className="h-5 w-5" />
                <span>More Info</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
