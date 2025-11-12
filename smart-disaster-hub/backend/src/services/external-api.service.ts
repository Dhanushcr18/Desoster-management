import axios from 'axios';

/**
 * External Alert Service
 * Integrates with external APIs to fetch disaster alerts
 * This is a mock implementation with real API structure
 */

interface ExternalAlert {
  title: string;
  description: string;
  coordinates: [number, number];
  severity: 'low' | 'medium' | 'high';
  source: string;
}

/**
 * Fetch alerts from OpenWeatherMap API
 * Requires API key from https://openweathermap.org/api
 */
export const fetchOpenWeatherAlerts = async (
  lat: number,
  lon: number
): Promise<ExternalAlert[]> => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ OPENWEATHER_API_KEY not set, using mock data');
    return getMockAlerts();
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
        }
      }
    );

    // Transform OpenWeatherMap alerts to our format
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
 * Fetch alerts from ReliefWeb API
 * Free API, no key required: https://reliefweb.int/help/api
 */
export const fetchReliefWebAlerts = async (
  country?: string
): Promise<ExternalAlert[]> => {
  try {
    const response = await axios.get(
      'https://api.reliefweb.int/v1/reports',
      {
        params: {
          appname: 'disaster-hub',
          limit: 10,
          ...(country && { 'filter[field]': 'country.name', 'filter[value]': country })
        }
      }
    );

    // Transform ReliefWeb data to our format
    const alerts: ExternalAlert[] = response.data.data?.map((item: any) => ({
      title: item.fields.title,
      description: item.fields.body || 'No description available',
      coordinates: [0, 0] as [number, number], // ReliefWeb doesn't always provide coordinates
      severity: 'medium' as const,
      source: 'ReliefWeb'
    })) || [];

    return alerts;
  } catch (error) {
    console.error('Failed to fetch ReliefWeb alerts:', error);
    return [];
  }
};

/**
 * Mock alerts for development and demo
 */
export const getMockAlerts = (): ExternalAlert[] => {
  return [
    {
      title: 'Earthquake Alert - 5.2 Magnitude',
      description: 'Seismic activity detected in coastal region. Minor tremors expected.',
      coordinates: [-122.4194, 37.7749],
      severity: 'medium',
      source: 'Mock USGS'
    },
    {
      title: 'Flash Flood Warning',
      description: 'Heavy rainfall has caused flash flooding in low-lying areas. Avoid travel.',
      coordinates: [-118.2437, 34.0522],
      severity: 'high',
      source: 'Mock NOAA'
    },
    {
      title: 'Wildfire Watch',
      description: 'High fire danger due to dry conditions and strong winds.',
      coordinates: [-122.0842, 37.4220],
      severity: 'medium',
      source: 'Mock Cal Fire'
    }
  ];
};

/**
 * Aggregate alerts from multiple sources
 */
export const fetchAggregatedAlerts = async (
  lat?: number,
  lon?: number,
  country?: string
): Promise<ExternalAlert[]> => {
  const alertPromises: Promise<ExternalAlert[]>[] = [];

  if (lat && lon) {
    alertPromises.push(fetchOpenWeatherAlerts(lat, lon));
  }

  if (country) {
    alertPromises.push(fetchReliefWebAlerts(country));
  }

  // Always include mock data for demo
  alertPromises.push(Promise.resolve(getMockAlerts()));

  const results = await Promise.allSettled(alertPromises);
  
  const alerts = results
    .filter((result): result is PromiseFulfilledResult<ExternalAlert[]> => 
      result.status === 'fulfilled'
    )
    .flatMap(result => result.value);

  return alerts;
};
