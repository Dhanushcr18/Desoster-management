import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, AlertTriangle, Info, TrendingUp, Users } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';
import LocationReports from './LocationReports';
import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

interface AlertDetailsModalProps {
  alert: any;
  onClose: () => void;
  onUpdateStatus?: () => void;
}

export default function AlertDetailsModal({ alert, onClose, onUpdateStatus }: AlertDetailsModalProps) {
  const [locationReports, setLocationReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<string[]>(alert.photos || []);

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
        `${API_URL}/api/alerts/${alert._id}/location-reports`,
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setUploadSuccess(false);

    // Check if adding these photos would exceed the limit
    if (localPhotos.length + files.length > 5) {
      setUploadError(`Cannot upload more than 5 photos total. Currently have ${localPhotos.length} photo(s).`);
      return;
    }

    setUploadingPhotos(true);

    try {
      const newPhotos: string[] = [];

      // Convert files to base64
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`Photo "${file.name}" is too large. Maximum size is 5MB.`);
          setUploadingPhotos(false);
          return;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newPhotos.push(base64);
      }

      // Upload photos to the alert (token optional)
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await axios.patch(
        `${API_URL}/api/alerts/${alert._id}/photos`,
        { photos: newPhotos },
        { headers }
      );

      // Update local state with new photos
      setLocalPhotos(response.data.alert.photos);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);

      // Clear the input
      e.target.value = '';
    } catch (error: any) {
      console.error('Failed to upload photos:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
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
                    {Number(alert.geometry?.coordinates?.[1] ?? alert.latitude ?? 0).toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Longitude</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Number(alert.geometry?.coordinates?.[0] ?? alert.longitude ?? 0).toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border-2 border-pink-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Disaster Photos</span>
              {localPhotos.length > 0 && (
                <span className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {localPhotos.length} {localPhotos.length === 1 ? 'Photo' : 'Photos'}
                </span>
              )}
            </h3>

{localPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {localPhotos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer overflow-hidden rounded-xl border-3 border-pink-300 hover:border-purple-500 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      // Open full-size image in new tab
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(`
                          <html>
                            <head>
                              <title>Disaster Photo ${index + 1} - ${alert.title}</title>
                              <style>
                                body { 
                                  margin: 0; 
                                  display: flex; 
                                  justify-content: center; 
                                  align-items: center; 
                                  min-height: 100vh; 
                                  background: #000; 
                                  padding: 20px;
                                  box-sizing: border-box;
                                }
                                img { 
                                  max-width: 100%; 
                                  max-height: 100vh; 
                                  object-fit: contain;
                                  border-radius: 8px;
                                  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                                }
                                .info {
                                  position: fixed;
                                  top: 20px;
                                  left: 20px;
                                  background: rgba(255,255,255,0.9);
                                  padding: 15px 20px;
                                  border-radius: 8px;
                                  color: #333;
                                  font-family: Arial, sans-serif;
                                  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                                }
                                .close-btn {
                                  position: fixed;
                                  top: 20px;
                                  right: 20px;
                                  background: rgba(255,255,255,0.9);
                                  border: none;
                                  width: 40px;
                                  height: 40px;
                                  border-radius: 50%;
                                  cursor: pointer;
                                  font-size: 24px;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                                }
                                .close-btn:hover {
                                  background: rgba(255,255,255,1);
                                }
                              </style>
                            </head>
                            <body>
                              <div class="info">
                                <strong>📸 Photo ${index + 1} of ${localPhotos.length}</strong><br>
                                <small>${alert.title}</small>
                              </div>
                              <button class="close-btn" onclick="window.close()">✕</button>
                              <img src="${photo}" alt="Disaster Photo ${index + 1}" />
                            </body>
                          </html>
                        `);
                      }
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Disaster photo ${index + 1}`}
                      className="w-full h-32 sm:h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
                      <svg className="h-10 w-10 text-white mb-2 transform scale-0 group-hover:scale-100 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span className="text-white font-bold text-sm">Click to View</span>
                    </div>
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Photos Section */}
            {!alert.alertType && (
              <div className="mt-4">
                <label className="block cursor-pointer">
                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-dashed border-pink-400 hover:border-purple-500 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <div>
                        <p className="text-purple-700 font-bold text-sm">
                          {uploadingPhotos ? 'Uploading...' : localPhotos.length > 0 ? 'Add More Photos' : 'Upload Photos to Help Others'}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          {localPhotos.length < 5 ? `${5 - localPhotos.length} photo(s) remaining • Max 5MB each` : 'Maximum photos reached'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhotos || localPhotos.length >= 5}
                    className="hidden"
                  />
                </label>

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="mt-3 bg-green-100 border-2 border-green-500 rounded-lg p-3 flex items-center space-x-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700 font-medium text-sm">Photos uploaded successfully!</span>
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <div className="mt-3 bg-red-100 border-2 border-red-500 rounded-lg p-3 flex items-start space-x-2">
                    <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 font-medium text-sm">{uploadError}</span>
                  </div>
                )}

                {/* Info Text */}
                {localPhotos.length > 0 && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-700 font-medium flex items-center justify-center space-x-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Click on any photo to view full size</span>
                    </p>
                  </div>
                )}
              </div>
            )}
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
