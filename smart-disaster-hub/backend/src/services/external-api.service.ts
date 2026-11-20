import axios from 'axios';
import env from '../config/env';

/**
 * External Alert Service
 * Integrates with external APIs to fetch disaster alerts
 */

export interface ExternalAlert {
  title: string;
  description: string;
  coordinates: [number, number]; // [lon, lat] for GeoJSON compatibility
  severity: 'low' | 'medium' | 'high';
  source: string;
}

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Fetch alerts from OpenWeatherMap API (optional, key-dependent)
 */
export const fetchOpenWeatherAlerts = async (
  lat: number,
  lon: number
): Promise<ExternalAlert[]> => {
  const apiKey = env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall`,
      {
        params: {
          lat,
          lon,
          appid: apiKey,
          exclude: 'minutely,hourly,daily'
        },
        timeout: REQUEST_TIMEOUT_MS
      }
    );

    const alerts: ExternalAlert[] = response.data.alerts?.map((alert: any) => ({
      title: alert.event,
      description: alert.description,
      coordinates: [lon, lat] as [number, number],
      severity: 'high' as const,
      source: 'OpenWeatherMap'
    })) || [];

    return alerts;
  } catch (error) {
    console.error('Failed to fetch OpenWeather alerts:', error);
    return [];
  }
};

/**
 * Fetch alerts from ReliefWeb API (free, filtered to India by default)
 */
export const fetchReliefWebAlerts = async (
  country: string = 'India'
): Promise<ExternalAlert[]> => {
  try {
    const response = await axios.get(
      'https://api.reliefweb.int/v1/reports',
      {
        params: {
          appname: 'smart-disaster-hub',
          limit: 10,
          'filter[field]': 'country.name',
          'filter[value]': country
        },
        timeout: REQUEST_TIMEOUT_MS
      }
    );

    const alerts: ExternalAlert[] = (response.data.data || []).map((item: any) => ({
      title: item.fields.title,
      description: item.fields.body || 'No detailed description available from ReliefWeb.',
      coordinates: [78.9629, 20.5937] as [number, number], // India centroid default
      severity: 'medium' as const,
      source: 'ReliefWeb (India)'
    }));

    return alerts;
  } catch (error) {
    console.warn('Failed to fetch ReliefWeb alerts, using demo fallback:', (error as Error).message);
    return [];
  }
};

/**
 * Fetch weather-derived alerts using keyless Open-Meteo forecast API
 */
export const fetchOpenMeteoAlerts = async (
  lat: number = 12.9716,
  lon: number = 77.5946
): Promise<ExternalAlert[]> => {
  try {
    const response = await axios.get(
      'https://api.open-meteo.com/v1/forecast',
      {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'precipitation,precipitation_probability',
          forecast_days: 2,
          timezone: 'Asia/Kolkata'
        },
        timeout: REQUEST_TIMEOUT_MS
      }
    );

    const hourlyRain: number[] = response.data.hourly?.precipitation || [];
    const sum24h = hourlyRain.slice(0, 24).reduce((a, b) => a + b, 0);

    if (sum24h > 40) {
      return [{
        title: `Heavy Rain Alert (${sum24h.toFixed(1)} mm / 24h)`,
        description: `Open-Meteo forecast indicates ${sum24h.toFixed(1)} mm of rainfall in 24 hours. High risk of waterlogging and flash floods.`,
        coordinates: [lon, lat],
        severity: sum24h > 90 ? 'high' : 'medium',
        source: 'Open-Meteo Weather Alert'
      }];
    }

    return [];
  } catch (error) {
    console.warn('Open-Meteo alert check failed:', (error as Error).message);
    return [];
  }
};

/**
 * Clearly labelled DEMO fallback alerts for key Indian corridors
 */
export const getIndianDemoFallbackAlerts = (): ExternalAlert[] => {
  return [
    {
      title: '[DEMO] Kerala Wayanad Landslide Warning',
      description: 'Severe slope saturation and debris flow risk along Thamarassery Ghat (NH766). Avoid travel.',
      coordinates: [76.02, 11.53],
      severity: 'high',
      source: 'DEMO Fallback (Kerala SDMA)'
    },
    {
      title: '[DEMO] Karnataka Shiradi Ghat Flash Flood Warning',
      description: 'Gundya River overflow near Sakleshpur - Shiradi Ghat stretch. Road blocked for heavy transport.',
      coordinates: [75.63, 12.83],
      severity: 'high',
      source: 'DEMO Fallback (Karnataka PWD)'
    },
    {
      title: '[DEMO] Chennai Urban Flood Watch',
      description: 'Inundation reported on OMR and Velachery low-lying sectors following intense coastal rain.',
      coordinates: [80.22, 12.98],
      severity: 'medium',
      source: 'DEMO Fallback (Greater Chennai Corp)'
    },
    {
      title: '[DEMO] Assam Brahmaputra River Surge',
      description: 'Water level crossing danger mark near Guwahati. Low-lying bypass roads waterlogged.',
      coordinates: [91.73, 26.14],
      severity: 'medium',
      source: 'DEMO Fallback (Central Water Commission)'
    }
  ];
};

/**
 * Aggregate alerts from real sources (ReliefWeb India, Open-Meteo, OpenWeather),
 * falling back to labelled Indian demo data if no external alerts are returned.
 */
export const fetchAggregatedAlerts = async (
  lat?: number,
  lon?: number,
  country: string = 'India'
): Promise<ExternalAlert[]> => {
  const alertPromises: Promise<ExternalAlert[]>[] = [];

  if (lat && lon) {
    alertPromises.push(fetchOpenWeatherAlerts(lat, lon));
    alertPromises.push(fetchOpenMeteoAlerts(lat, lon));
  } else {
    // Default to Southern India corridor monitoring point
    alertPromises.push(fetchOpenMeteoAlerts(12.83, 75.63));
  }

  alertPromises.push(fetchReliefWebAlerts(country));

  const results = await Promise.allSettled(alertPromises);
  const liveAlerts = results
    .filter((r): r is PromiseFulfilledResult<ExternalAlert[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  if (liveAlerts.length > 0) {
    return liveAlerts;
  }

  // Graceful offline fallback
  return getIndianDemoFallbackAlerts();
};

export default {
  fetchOpenWeatherAlerts,
  fetchReliefWebAlerts,
  fetchOpenMeteoAlerts,
  getIndianDemoFallbackAlerts,
  fetchAggregatedAlerts
};
