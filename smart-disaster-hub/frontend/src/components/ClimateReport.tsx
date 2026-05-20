import React, { useState, useEffect } from 'react';
import { X, Cloud, Droplets, Wind, Eye, Gauge, Sunrise, Sunset, MapPin, RefreshCw, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ClimateReportProps {
  onClose: () => void;
}

interface WeatherData {
  location: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  pressure: number;
  visibility: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  lat: number;
  lon: number;
  rainfall?: number;
  clouds: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 10);
  }, [center, map]);
  return null;
}

export default function ClimateReport({ onClose }: ClimateReportProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center

  const API_KEY = '895284fb2d2c50a520ea537456963d9c'; // OpenWeatherMap API key

  const processWeatherData = (data: any) => {
    const weather: WeatherData = {
      location: data.sys?.country ? `${data.name}, ${data.sys.country}` : data.name,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      pressure: data.main.pressure,
      visibility: (data.visibility || 10000) / 1000,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys?.sunrise || 0,
      sunset: data.sys?.sunset || 0,
      lat: data.coord.lat,
      lon: data.coord.lon,
      rainfall: data.rain?.['1h'] || 0,
      clouds: data.clouds?.all || 0
    };

    setWeatherData(weather);
    setMapCenter([weather.lat, weather.lon]);
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      processWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error('City not found');
      }

      const data = await response.json();
      processWeatherData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to find city');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to New Delhi if geolocation fails
          fetchWeatherByCoords(28.6139, 77.2090);
        }
      );
    } else {
      // Default to New Delhi
      fetchWeatherByCoords(28.6139, 77.2090);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      fetchWeatherByCity(searchCity.trim());
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWindDirection = (degree: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degree / 45) % 8];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Climate Report</h2>
                <p className="text-blue-100 text-sm">Real-time weather information</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search city... (e.g., Mumbai, Delhi, Bangalore)"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              title="Use current location"
            >
              <MapPin className="h-5 w-5" />
              <span className="hidden sm:inline">Current Location</span>
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-blue-600">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="text-lg font-semibold">Loading weather data...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {weatherData && !loading && (
            <div className="space-y-6">
              {/* Location & Main Weather */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{weatherData.location}</h3>
                    <p className="text-gray-600 capitalize mt-1">{weatherData.description}</p>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                    alt={weatherData.description}
                    className="w-20 h-20"
                  />
                </div>
                <div className="mt-4">
                  <div className="text-6xl font-bold text-blue-600">{weatherData.temp}°C</div>
                  <p className="text-gray-600 mt-2">Feels like {weatherData.feelsLike}°C</p>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Temperature */}
                <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Cloud className="h-5 w-5" />
                    <span className="font-semibold">Temperature</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.temp}°C</p>
                  <p className="text-sm text-gray-600 mt-1">Feels {weatherData.feelsLike}°C</p>
                </div>

                {/* Humidity */}
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Droplets className="h-5 w-5" />
                    <span className="font-semibold">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.humidity}%</p>
                  <p className="text-sm text-gray-600 mt-1">Moisture level</p>
                </div>

                {/* Wind Speed */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <Wind className="h-5 w-5" />
                    <span className="font-semibold">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.windSpeed} m/s</p>
                  <p className="text-sm text-gray-600 mt-1">{getWindDirection(weatherData.windDeg)} direction</p>
                </div>

                {/* Visibility */}
                <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Eye className="h-5 w-5" />
                    <span className="font-semibold">Visibility</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.visibility} km</p>
                  <p className="text-sm text-gray-600 mt-1">Clear view</p>
                </div>

                {/* Pressure */}
                <div className="bg-white border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Gauge className="h-5 w-5" />
                    <span className="font-semibold">Pressure</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.pressure}</p>
                  <p className="text-sm text-gray-600 mt-1">hPa</p>
                </div>

                {/* Rainfall */}
                <div className="bg-white border-2 border-cyan-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-cyan-600 mb-2">
                    <Droplets className="h-5 w-5" />
                    <span className="font-semibold">Rainfall</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{weatherData.rainfall || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">mm/h</p>
                </div>

                {/* Sunrise */}
                <div className="bg-white border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <Sunrise className="h-5 w-5" />
                    <span className="font-semibold">Sunrise</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(weatherData.sunrise)}</p>
                  <p className="text-sm text-gray-600 mt-1">Morning</p>
                </div>

                {/* Sunset */}
                <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Sunset className="h-5 w-5" />
                    <span className="font-semibold">Sunset</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(weatherData.sunset)}</p>
                  <p className="text-sm text-gray-600 mt-1">Evening</p>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Map
                  </h3>
                </div>
                <div style={{ height: '400px', width: '100%' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapUpdater center={mapCenter} />
                    <Marker position={mapCenter}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">{weatherData.location}</p>
                          <p className="text-2xl font-bold text-blue-600">{weatherData.temp}°C</p>
                          <p className="text-sm text-gray-600 capitalize">{weatherData.description}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-bold text-blue-900 mb-2">📊 Weather Summary</h4>
                <p className="text-gray-700">
                  Current weather in <span className="font-bold">{weatherData.location}</span> shows{' '}
                  <span className="font-bold">{weatherData.description}</span> with a temperature of{' '}
                  <span className="font-bold">{weatherData.temp}°C</span>. The humidity is at{' '}
                  <span className="font-bold">{weatherData.humidity}%</span> with wind speeds of{' '}
                  <span className="font-bold">{weatherData.windSpeed} m/s</span> from the{' '}
                  <span className="font-bold">{getWindDirection(weatherData.windDeg)}</span> direction.
                  Cloud coverage is <span className="font-bold">{weatherData.clouds}%</span>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
