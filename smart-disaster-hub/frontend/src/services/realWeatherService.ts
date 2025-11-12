// Real-time weather and disaster data integration service
import axios from 'axios';

// Using Open-Meteo (free, no API key required!)
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// USGS Earthquake API
const USGS_EARTHQUAKE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// Natural disasters by severity thresholds
const SEVERITY_THRESHOLDS = {
  earthquake: { critical: 7, high: 5.5, medium: 4 },
  temperature: { critical: 45, high: 40, medium: 35 }, // Celsius
  windSpeed: { critical: 150, high: 100, medium: 60 }, // km/h
  rainfall: { critical: 100, high: 50, medium: 20 }, // mm
};

interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  source: string;
  createdAt: string;
  alertType: string;
  metadata?: any;
}

// Major cities in India for intensive monitoring
const MONITORED_CITIES = [
  // India - Major metros
  { name: 'New Delhi', lat: 28.6139, lon: 77.2090, country: 'India' },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India' },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946, country: 'India' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'India' },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, country: 'India' },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, country: 'India' },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, country: 'India' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, country: 'India' },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, country: 'India' },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462, country: 'India' },
  { name: 'Surat', lat: 21.1702, lon: 72.8311, country: 'India' },
  { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, country: 'India' },
  
  // USA
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'USA' },
  
  // Europe
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
  
  // Asia
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE' },
];

class RealWeatherService {
  private cachedAlerts: WeatherAlert[] = [];
  private lastFetchTime: number = 0;
  private fetchInterval: number = 5 * 60 * 1000; // 5 minutes

  // Convert WMO weather code to description
  private getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown weather';
  }

  // Fetch earthquake data from USGS
  async fetchEarthquakeData(): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(USGS_EARTHQUAKE_URL);
      const earthquakes = response.data.features;

      return earthquakes
        .filter((eq: any) => eq.properties.mag >= 4.0) // Only significant earthquakes
        .map((eq: any) => {
          const magnitude = eq.properties.mag;
          const severity = 
            magnitude >= SEVERITY_THRESHOLDS.earthquake.critical ? 'high' :
            magnitude >= SEVERITY_THRESHOLDS.earthquake.high ? 'high' :
            magnitude >= SEVERITY_THRESHOLDS.earthquake.medium ? 'medium' : 'low';

          return {
            id: `earthquake-${eq.id}`,
            title: `Earthquake Alert - Magnitude ${magnitude.toFixed(1)}`,
            description: `${eq.properties.place}. Depth: ${eq.geometry.coordinates[2]}km. ${eq.properties.title}`,
            severity,
            geometry: {
              type: 'Point',
              coordinates: [eq.geometry.coordinates[0], eq.geometry.coordinates[1]]
            },
            source: 'USGS Earthquake Center',
            createdAt: new Date(eq.properties.time).toISOString(),
            alertType: 'earthquake',
            metadata: {
              magnitude: magnitude,
              depth: eq.geometry.coordinates[2],
              url: eq.properties.url
            }
          };
        });
    } catch (error) {
      console.error('Error fetching earthquake data:', error);
      return [];
    }
  }

  // Fetch weather alerts from Open-Meteo (free, no API key!)
  async fetchWeatherAlerts(): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    try {
      // Fetch weather for all monitored cities in parallel using Open-Meteo
      const weatherPromises = MONITORED_CITIES.map(city =>
        axios.get(OPEN_METEO_BASE_URL, {
          params: {
            latitude: city.lat,
            longitude: city.lon,
            current: 'temperature_2m,wind_speed_10m,weather_code',
            timezone: 'auto'
          }
        }).catch(() => null) // Ignore errors for individual cities
      );

      const responses = await Promise.all(weatherPromises);

      responses.forEach((response, index) => {
        if (!response) return;
        
        const data = response.data.current;
        const city = MONITORED_CITIES[index];
        const temp = data.temperature_2m;
        const windSpeed = data.wind_speed_10m; // Already in km/h
        const weatherCode = data.weather_code;
        const weatherDesc = this.getWeatherDescription(weatherCode);

        // Check for extreme temperature
        if (temp >= SEVERITY_THRESHOLDS.temperature.medium) {
          const severity = 
            temp >= SEVERITY_THRESHOLDS.temperature.critical ? 'high' :
            temp >= SEVERITY_THRESHOLDS.temperature.high ? 'high' : 'medium';

          alerts.push({
            id: `heatwave-${city.name}-${Date.now()}`,
            title: `🌡️ Extreme Heat Alert - ${city.name}`,
            description: `Temperature has reached ${temp.toFixed(1)}°C in ${city.name}, ${city.country}. Stay hydrated and avoid outdoor activities during peak hours.`,
            severity,
            geometry: {
              type: 'Point',
              coordinates: [city.lon, city.lat]
            },
            source: 'Open-Meteo Weather',
            createdAt: new Date().toISOString(),
            alertType: 'heatwave',
            metadata: { temperature: temp, weatherCode, description: weatherDesc }
          });
        }

        // Check for strong winds
        if (windSpeed >= SEVERITY_THRESHOLDS.windSpeed.medium) {
          const severity = 
            windSpeed >= SEVERITY_THRESHOLDS.windSpeed.critical ? 'high' :
            windSpeed >= SEVERITY_THRESHOLDS.windSpeed.high ? 'high' : 'medium';

          alerts.push({
            id: `windstorm-${city.name}-${Date.now()}`,
            title: `💨 High Wind Warning - ${city.name}`,
            description: `Wind speeds of ${windSpeed.toFixed(0)} km/h reported in ${city.name}, ${city.country}. Secure loose objects and avoid travel if possible.`,
            severity,
            geometry: {
              type: 'Point',
              coordinates: [city.lon, city.lat]
            },
            source: 'Open-Meteo Weather',
            createdAt: new Date().toISOString(),
            alertType: 'windstorm',
            metadata: { windSpeed, weatherCode, description: weatherDesc }
          });
        }

        // Check for severe weather conditions (thunderstorms, tornadoes)
        if (weatherCode >= 95) { // Thunderstorm codes
          alerts.push({
            id: `storm-${city.name}-${Date.now()}`,
            title: `⛈️ Severe Weather Alert - ${city.name}`,
            description: `${weatherDesc} detected in ${city.name}, ${city.country}. Seek shelter immediately and avoid outdoor activities.`,
            severity: 'high',
            geometry: {
              type: 'Point',
              coordinates: [city.lon, city.lat]
            },
            source: 'Open-Meteo Weather',
            createdAt: new Date().toISOString(),
            alertType: 'storm',
            metadata: { weatherCode, description: weatherDesc }
          });
        }
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }

    return alerts;
  }

  // Get all real-time alerts
  async getAllAlerts(): Promise<WeatherAlert[]> {
    const now = Date.now();
    
    // Return cached data if recent
    if (now - this.lastFetchTime < this.fetchInterval && this.cachedAlerts.length > 0) {
      return this.cachedAlerts;
    }

    try {
      // Fetch all data sources in parallel
      const [earthquakes, weatherAlerts] = await Promise.all([
        this.fetchEarthquakeData(),
        this.fetchWeatherAlerts()
      ]);

      // Get live Indian disasters
      const indianDisasters = this.getLiveIndianDisasters();

      // Combine all alerts (Indian disasters first for visibility)
      this.cachedAlerts = [...indianDisasters, ...earthquakes, ...weatherAlerts];
      this.lastFetchTime = now;

      console.log(`Loaded ${this.cachedAlerts.length} alerts (${indianDisasters.length} Indian disasters)`);

      return this.cachedAlerts;
    } catch (error) {
      console.error('Error fetching all alerts:', error);
      return this.cachedAlerts; // Return cached data on error
    }
  }

  // Get simulated live Indian disaster alerts (recent events)
  private getLiveIndianDisasters(): WeatherAlert[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    return [
      // Delhi car bomb blast (simulated based on your request)
      {
        id: `india-terror-${Date.now()}-1`,
        title: '🚨 CRITICAL: Security Alert - Delhi',
        description: 'Security agencies on high alert following reports of suspicious activity. Police have cordoned off the area and are conducting thorough investigations. Citizens advised to stay away from crowded places and report any suspicious activity immediately.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi
        },
        source: 'India Emergency Services',
        createdAt: yesterday.toISOString(),
        alertType: 'security',
        metadata: {
          location: 'Central Delhi',
          status: 'Active Investigation',
          authoritiesInvolved: ['Delhi Police', 'NSG', 'Bomb Squad'],
          publicAdvisory: 'Avoid crowded areas, follow police instructions'
        }
      },
      
      // Mumbai heavy rainfall
      {
        id: `india-rain-${Date.now()}-2`,
        title: '🌧️ Heavy Rainfall Warning - Mumbai',
        description: 'IMD issues red alert as Mumbai experiences intense rainfall. Waterlogging reported in several areas including Andheri, Sion, and Kurla. Local train services partially affected. Citizens advised to stay indoors unless necessary.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai
        },
        source: 'India Meteorological Department',
        createdAt: now.toISOString(),
        alertType: 'flood',
        metadata: {
          rainfall: '120 mm in 3 hours',
          affectedAreas: ['Andheri', 'Sion', 'Kurla', 'Dadar'],
          trainStatus: 'Partially disrupted',
          duration: 'Next 6-12 hours'
        }
      },

      // Bangalore traffic accident
      {
        id: `india-accident-${Date.now()}-3`,
        title: '⚠️ Major Traffic Disruption - Bangalore',
        description: 'Major accident on Outer Ring Road causing severe traffic congestion. Emergency services on site. Commuters advised to use alternate routes via Sarjapur Road or Old Airport Road.',
        severity: 'medium',
        geometry: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore
        },
        source: 'Bangalore Traffic Police',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        alertType: 'accident',
        metadata: {
          location: 'Outer Ring Road, near Marathahalli',
          affectedStretch: '5 km',
          estimatedClearance: '2-3 hours',
          alternateRoutes: ['Sarjapur Road', 'Old Airport Road']
        }
      },

      // Chennai heatwave
      {
        id: `india-heat-${Date.now()}-4`,
        title: '🌡️ Severe Heatwave - Chennai',
        description: 'Temperatures soaring above 42°C in Chennai. Health department advises citizens to stay hydrated, avoid direct sunlight between 11 AM to 4 PM. Several schools declare early closure.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [80.2707, 13.0827] // Chennai
        },
        source: 'Tamil Nadu Health Department',
        createdAt: now.toISOString(),
        alertType: 'heatwave',
        metadata: {
          temperature: '42.5°C',
          duration: 'Next 48 hours',
          healthAdvisory: 'Stay hydrated, avoid outdoor activities',
          hospitalAlerts: '15% increase in heat stroke cases'
        }
      },

      // Delhi air quality
      {
        id: `india-aqi-${Date.now()}-5`,
        title: '💨 Hazardous Air Quality - Delhi NCR',
        description: 'Air Quality Index reaches hazardous levels (AQI 450+). CPCB advises sensitive groups to stay indoors. Use of N95 masks recommended when stepping out. Schools in Delhi-NCR may remain closed.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi
        },
        source: 'Central Pollution Control Board',
        createdAt: now.toISOString(),
        alertType: 'pollution',
        metadata: {
          aqi: 465,
          category: 'Hazardous',
          pm25: '380 µg/m³',
          recommendation: 'Avoid outdoor activities, use air purifiers',
          schoolStatus: 'Physical classes suspended'
        }
      },

      // Kolkata cyclone warning
      {
        id: `india-cyclone-${Date.now()}-6`,
        title: '🌀 Cyclone Warning - Kolkata & West Bengal',
        description: 'IMD issues cyclone warning for coastal West Bengal. Wind speeds expected to reach 80-90 km/h. Fishermen advised not to venture into sea. NDRF teams on standby.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [88.3639, 22.5726] // Kolkata
        },
        source: 'India Meteorological Department',
        createdAt: twoDaysAgo.toISOString(),
        alertType: 'cyclone',
        metadata: {
          cycloneName: 'Low Pressure Area',
          windSpeed: '80-90 km/h',
          expectedLandfall: 'Next 36 hours',
          evacuations: '5,000+ people from coastal areas',
          ndrfTeams: '12 teams deployed'
        }
      },

      // Hyderabad building collapse
      {
        id: `india-building-${Date.now()}-7`,
        title: '🏢 Building Collapse - Hyderabad',
        description: 'Rescue operations underway after residential building collapse in old city. NDRF, Fire services, and local police engaged in search and rescue. Several people feared trapped.',
        severity: 'high',
        geometry: {
          type: 'Point',
          coordinates: [78.4867, 17.3850] // Hyderabad
        },
        source: 'Hyderabad NDRF',
        createdAt: yesterday.toISOString(),
        alertType: 'building-collapse',
        metadata: {
          location: 'Old City, Hyderabad',
          buildingAge: '50+ years',
          rescueTeams: 'NDRF, Fire Brigade, Local Police',
          casualties: 'Under assessment',
          cause: 'Under investigation'
        }
      }
    ];
  }

  // Get alerts for a specific region
  async getAlertsForRegion(minLat: number, maxLat: number, minLon: number, maxLon: number): Promise<WeatherAlert[]> {
    const allAlerts = await this.getAllAlerts();
    
    return allAlerts.filter(alert => {
      const [lon, lat] = alert.geometry.coordinates;
      return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    });
  }
}

export const realWeatherService = new RealWeatherService();
export type { WeatherAlert };
