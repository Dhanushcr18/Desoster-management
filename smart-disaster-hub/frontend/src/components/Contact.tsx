import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Send, MapPin, Phone, Mail, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    disasterType: '',
    severity: 'medium',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getLocation = () => {
    setGettingLocation(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        setError('Unable to get your location. Please enter manually.');
        setGettingLocation(false);
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length + photos.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Each photo must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Note: login is no longer required - community reports are allowed without auth

      // Use geolocation if available, otherwise try to parse the location string
      let coordinates: [number, number];
      if (geoLocation) {
        coordinates = [geoLocation.lon, geoLocation.lat];
      } else if (formData.location) {
        // Try to parse coordinates from location string (format: "lat, lon" or "12.8556, 77.5347")
        const coordMatch = formData.location.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lon = parseFloat(coordMatch[2]);
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            coordinates = [lon, lat]; // MongoDB uses [longitude, latitude]
          } else {
            setError('Invalid coordinates. Please use format: latitude, longitude (e.g., 12.8556, 77.5347)');
            setLoading(false);
            return;
          }
        } else {
          // If not coordinates, use default location with location name in title
          // In production, you would use a geocoding service
          coordinates = [77.5946, 12.9716]; // Default to Bangalore
        }
      } else {
        setError('Please provide your location or enable geolocation');
        setLoading(false);
        return;
      }

      // Create alert from the report
      const alertData = {
        title: `${formData.disasterType} - ${formData.location}`,
        description: formData.description || `Disaster reported by ${formData.name}. Contact: ${formData.phone || formData.email}`,
        geometry: { coordinates },
        severity: formData.severity as 'low' | 'medium' | 'high',
        source: `Community Report - ${formData.name}`,
        photos: photos.length > 0 ? photos : undefined
      };
      
      console.log('Submitting alert:', alertData);
      await alertsAPI.create(alertData);

      setSubmitted(true);
      setGeoLocation(null);
      setPhotos([]);
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        disasterType: '',
        severity: 'medium',
        description: '',
      });
    } catch (err: any) {
      console.error('Submit error:', err);
      console.error('Error response:', err.response);

      // Check for network error
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Network Error: Cannot connect to server. Please check if the backend is running on http://localhost:3001');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again to submit a report.');
        setTimeout(() => navigate('/login'), 2500);
      } else if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Failed to submit report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                DisasterAlert
              </span>
            </Link>
            <div className="flex space-x-3">
              <Link
                to="/"
                className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition"
              >
                Back to Home
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Info */}
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Report a Disaster or
              <span className="block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Get Emergency Help
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your safety is our priority. Report disasters in your area and help authorities respond faster.
            </p>

            {/* Emergency Info Cards */}
            <div className="space-y-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-8 w-8 text-red-500 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Hotline</h3>
                    <p className="text-gray-600 mb-2">For immediate life-threatening emergencies</p>
                    <p className="text-3xl font-bold text-red-500">911</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Support Line</h4>
                    <p className="text-gray-600">1-800-DISASTER (1-800-347-2783)</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
                    <p className="text-gray-600">emergency@disasteralert.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-emerald-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Headquarters</h4>
                    <p className="text-gray-600">123 Emergency Blvd, Safety City, SC 12345</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What happens after you report?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700">Immediate notification to local authorities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700">Alert sent to nearby community members</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700">Emergency response team dispatched</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700">Real-time updates on rescue operations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Report Submitted!</h2>
                <p className="text-gray-600 mb-8">
                  Thank you for your report. Authorities have been notified and will respond shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full font-semibold hover:shadow-lg transition"
                >
                  Submit Another Report
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Report a Disaster</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="location"
                        value={formData.location || (geoLocation ? `${geoLocation.lat.toFixed(4)}, ${geoLocation.lon.toFixed(4)}` : '')}
                        onChange={handleChange}
                        required
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="City, State or Address"
                      />
                      <button
                        type="button"
                        onClick={getLocation}
                        disabled={gettingLocation}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                        title="Get my current location"
                      >
                        {gettingLocation ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <MapPin className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {geoLocation && (
                      <p className="text-xs text-emerald-600 mt-1">
                        ✓ Location detected: {geoLocation.lat.toFixed(4)}°, {geoLocation.lon.toFixed(4)}°
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Disaster Type *
                      </label>
                      <select
                        name="disasterType"
                        value={formData.disasterType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select type...</option>
                        <option value="earthquake">Earthquake</option>
                        <option value="flood">Flood</option>
                        <option value="wildfire">Wildfire</option>
                        <option value="hurricane">Hurricane</option>
                        <option value="tornado">Tornado</option>
                        <option value="landslide">Landslide</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Severity Level *
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Please provide details about the disaster, injuries, and any immediate needs..."
                    />
                  </div>

                  {/* Photo Upload Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📸 Upload Photos (Optional)
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 cursor-pointer transition bg-gray-50 hover:bg-emerald-50">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-emerald-600">Click to upload</span> or drag photos
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (Max 5 photos)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Photo Preview */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                      <AlertTriangle size={20} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Submit Emergency Report</span>
                      </>
                    )}
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    * All fields are required. For life-threatening emergencies, call 911 immediately.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
