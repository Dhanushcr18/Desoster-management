import React, { useState } from 'react';
import type { AlertWithStats } from '../types';
import { reportsAPI } from '../services/api';
import { X, Heart, AlertTriangle, Users, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

interface ReportModalProps {
  alert: AlertWithStats;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportModal({ alert, onClose, onSuccess }: ReportModalProps) {
  const [status, setStatus] = useState<'safe' | 'help' | null>(null);
  const [note, setNote] = useState('');
  const [safeRadius, setSafeRadius] = useState<string>('');
  
  // Location details
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [affectedRoad, setAffectedRoad] = useState('');
  const [alternateRoute, setAlternateRoute] = useState('');
  const [extraDistance, setExtraDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!status) {
      setError('Please select a status');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const locationDetails: any = {};
      
      if (address) locationDetails.address = address;
      if (landmark) locationDetails.landmark = landmark;
      if (affectedRoad) locationDetails.affectedRoad = affectedRoad;
      if (alternateRoute) locationDetails.alternateRoute = alternateRoute;
      if (extraDistance) locationDetails.extraDistance = parseFloat(extraDistance);
      if (estimatedTime) locationDetails.estimatedTime = parseInt(estimatedTime);
      if (routeDescription) locationDetails.routeDescription = routeDescription;

      await reportsAPI.create({
        alertId: alert._id,
        status,
        note: note.trim() || undefined,
        safeRadius: safeRadius ? parseFloat(safeRadius) : undefined,
        locationDetails: Object.keys(locationDetails).length > 0 ? locationDetails : undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const safeCount = alert.reportStats?.safe || 0;
  const helpCount = alert.reportStats?.help || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">{alert.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{alert.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDistanceToNow(alert.createdAt)}</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                alert.severity === 'high' ? 'bg-red-500/20 text-red-500' :
                alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {alert.severity}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-white font-semibold mb-2">Description</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{alert.description}</p>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="text-green-500" size={20} />
                <span className="text-green-500 text-2xl font-bold">{safeCount}</span>
              </div>
              <p className="text-sm text-gray-400">Reported Safe</p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="text-red-500" size={20} />
                <span className="text-red-500 text-2xl font-bold">{helpCount}</span>
              </div>
              <p className="text-sm text-gray-400">Need Help</p>
            </div>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-3">Update Your Status</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setStatus('safe')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    status === 'safe'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-green-500/50'
                  }`}
                >
                  <Heart className={`mx-auto mb-2 ${status === 'safe' ? 'text-green-500' : 'text-gray-400'}`} size={32} />
                  <p className={`font-semibold ${status === 'safe' ? 'text-green-500' : 'text-white'}`}>
                    I'm Safe
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('help')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    status === 'help'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-red-500/50'
                  }`}
                >
                  <AlertTriangle className={`mx-auto mb-2 ${status === 'help' ? 'text-red-500' : 'text-gray-400'}`} size={32} />
                  <p className={`font-semibold ${status === 'help' ? 'text-red-500' : 'text-white'}`}>
                    Request Help
                  </p>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Safe Radius from Disaster Area (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={safeRadius}
                      onChange={(e) => setSafeRadius(e.target.value)}
                      min="0"
                      max="1000"
                      step="0.5"
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">km</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    💡 Help others by sharing how far from the disaster area is safe to stay
                  </p>
                </div>

                {/* Location & Route Details Section */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-400" />
                    Location & Route Information (Optional)
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Your Address/Area
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g., Indiranagar, Bangalore"
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Nearby Landmark
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g., 100ft Road Metro"
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        🚧 Affected Road/Area
                      </label>
                      <input
                        type="text"
                        value={affectedRoad}
                        onChange={(e) => setAffectedRoad(e.target.value)}
                        placeholder="e.g., MG Road flooded from Trinity to Brigade Road"
                        className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        ✅ Alternate Route Recommendation
                      </label>
                      <input
                        type="text"
                        value={alternateRoute}
                        onChange={(e) => setAlternateRoute(e.target.value)}
                        placeholder="e.g., Take Residency Road via Richmond Circle"
                        className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Extra Distance via Alternate (km)
                        </label>
                        <input
                          type="number"
                          value={extraDistance}
                          onChange={(e) => setExtraDistance(e.target.value)}
                          min="0"
                          step="0.1"
                          placeholder="e.g., 2.5"
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                          min="0"
                          placeholder="e.g., 15"
                          className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Detailed Route Description
                      </label>
                      <textarea
                        value={routeDescription}
                        onChange={(e) => setRouteDescription(e.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder="e.g., From Indiranagar, take CMH Road to Koramangala, avoid Hosur Road completely. Turn left at Sony Signal..."
                        className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{routeDescription.length}/1000 characters</p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-300">
                        💡 <strong>Help your community!</strong> Share exact road conditions, alternate routes, and distances to help others navigate safely around the disaster area.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Share your situation or location details..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{note.length}/500 characters</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded flex items-center gap-2">
                <AlertTriangle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !status}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Submitting...' : 'Submit Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
