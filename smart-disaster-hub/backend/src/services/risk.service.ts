import axios from 'axios';
import Road, { RiskLevel } from '../models/Road.model';
import Alert from '../models/Alert.model';
import { samplePointsEvenly, haversineDistanceKm, LatLng } from '../utils/geo';
import { io } from '../server';

const REQUEST_TIMEOUT_MS = 8000;

// Configurable Risk Thresholds
export const RISK_THRESHOLDS = {
  MODERATE: 25,
  HIGH: 50,
  SEVERE: 75,
};

export interface RiskFactors {
  rainfall24h: number;
  rainfall48h: number;
  peakHourlyRain: number;
  precipProbability: number; // 0 - 100
  minElevation: number | null;
  elevationVariance: number;
  riverDischargeRatio: number | null;
  nearbyDisasterAlert: boolean;
}

export interface RiskAssessmentResult {
  riskScore: number;
  riskLevel: RiskLevel;
  riskReason: string;
  rainfall24h: number;
  rainfall48h: number;
  peakHourlyRain: number;
  minElevation: number | null;
  riverDischargeRatio: number | null;
}

// In-memory 30-minute weather cache
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const weatherCache = new Map<string, CacheEntry<{ hourlyRain: number[]; prob: number[] }>>();
const elevationCache = new Map<string, number>();

/**
 * Weather forecast for a lat/lng point using Open-Meteo
 */
async function fetchPointWeather(
  lat: number,
  lng: number
): Promise<{ hourlyRain: number[]; prob: number[] }> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: 'precipitation,precipitation_probability',
        forecast_days: 3,
        timezone: 'Asia/Kolkata',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const hourlyRain: number[] = res.data.hourly?.precipitation || [];
    const prob: number[] = res.data.hourly?.precipitation_probability || [];
    const entry = { hourlyRain, prob };
    weatherCache.set(cacheKey, { data: entry, cachedAt: Date.now() });
    return entry;
  } catch (err: any) {
    console.warn(`[RiskService] Weather API failed for (${lat}, ${lng}): ${err.message}`);
    // Safe fallback if cached entry exists even if expired
    if (cached) return cached.data;
    return { hourlyRain: [], prob: [] };
  }
}

/**
 * Elevation for a lat/lng point using Open-Meteo
 */
async function fetchPointElevation(lat: number, lng: number): Promise<number | null> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey)!;
  }

  try {
    const res = await axios.get('https://api.open-meteo.com/v1/elevation', {
      params: { latitude: lat, longitude: lng },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const elev = Array.isArray(res.data.elevation)
      ? res.data.elevation[0]
      : res.data.elevation;
    if (typeof elev === 'number') {
      elevationCache.set(cacheKey, elev);
      return elev;
    }
    return null;
  } catch (err: any) {
    console.warn(`[RiskService] Elevation API failed for (${lat}, ${lng}): ${err.message}`);
    return null;
  }
}

/**
 * River discharge ratio for a lat/lng point using Open-Meteo Flood API
 */
async function fetchRiverDischargeRatio(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await axios.get('https://flood-api.open-meteo.com/v1/flood', {
      params: {
        latitude: lat,
        longitude: lng,
        daily: 'river_discharge,river_discharge_mean',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const dailyDischarge: number[] = res.data.daily?.river_discharge || [];
    const dailyMean: number[] = res.data.daily?.river_discharge_mean || [];
    if (dailyDischarge.length > 0 && dailyMean.length > 0 && dailyMean[0] > 0) {
      return dailyDischarge[0] / dailyMean[0];
    }
    return null;
  } catch {
    // Ignore river discharge errors gracefully
    return null;
  }
}

/**
 * Pure transparent risk scoring formula (0-100)
 */
export function calculateRiskScore(factors: RiskFactors): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  // 1. Rain 48h component (0-45)
  // Scale 0 at <=20mm to 45 at >=200mm
  let rain48Component = 0;
  if (factors.rainfall48h > 20) {
    rain48Component = Math.min(45, ((factors.rainfall48h - 20) / (200 - 20)) * 45);
  }

  // 2. Peak hourly intensity component (0-20)
  // Scale 0 at <=5mm/h to 20 at >=40mm/h
  let peakComponent = 0;
  if (factors.peakHourlyRain > 5) {
    peakComponent = Math.min(20, ((factors.peakHourlyRain - 5) / (40 - 5)) * 20);
  }

  // 3. Terrain / Low elevation component (0-15)
  // Low elevation (<25m) increases flood vulnerability, steep terrain (variance > 100m) increases landslide risk
  let terrainComponent = 0;
  if (factors.minElevation !== null && factors.minElevation < 30) {
    // Low lying coastal / river basin
    terrainComponent += Math.min(10, Math.max(0, (30 - factors.minElevation) / 3));
  }
  if (factors.elevationVariance > 80) {
    // Steep ghat / slope
    terrainComponent += Math.min(10, (factors.elevationVariance / 300) * 10);
  }
  terrainComponent = Math.min(15, terrainComponent);

  // 4. River discharge ratio component (0-15)
  // Ratio > 1.5 indicates river swelling; > 2.5 severe flood overflow
  let riverComponent = 0;
  if (factors.riverDischargeRatio !== null && factors.riverDischargeRatio > 1.2) {
    riverComponent = Math.min(15, ((factors.riverDischargeRatio - 1.2) / (3.0 - 1.2)) * 15);
  }

  // Raw base sum (0-95)
  let baseScore = rain48Component + peakComponent + terrainComponent + riverComponent;

  // 5. Precipitation probability multiplier (0.7 - 1.0)
  const prob = Math.max(0, Math.min(100, factors.precipProbability));
  const probMultiplier = 0.7 + 0.3 * (prob / 100);
  baseScore *= probMultiplier;

  // 6. Active nearby flood/landslide alert adds +10
  if (factors.nearbyDisasterAlert) {
    baseScore += 10;
  }

  // Clamp 0-100
  const finalScore = Math.min(100, Math.max(0, Math.round(baseScore * 10) / 10));

  // Determine Level
  let level: RiskLevel = 'low';
  if (finalScore >= RISK_THRESHOLDS.SEVERE) {
    level = 'severe';
  } else if (finalScore >= RISK_THRESHOLDS.HIGH) {
    level = 'high';
  } else if (finalScore >= RISK_THRESHOLDS.MODERATE) {
    level = 'moderate';
  }

  // Generate plain-English reason with concrete numbers
  const reasons: string[] = [];
  reasons.push(`${factors.rainfall48h.toFixed(0)} mm rain forecast in 48h (peak ${factors.peakHourlyRain.toFixed(0)} mm/h)`);
  if (factors.minElevation !== null) {
    if (factors.minElevation < 30) {
      reasons.push(`low-lying sector (${factors.minElevation.toFixed(0)} m elevation)`);
    } else if (factors.elevationVariance > 100) {
      reasons.push(`steep terrain variance (${factors.elevationVariance.toFixed(0)} m gradient)`);
    }
  }
  if (factors.riverDischargeRatio !== null && factors.riverDischargeRatio > 1.3) {
    reasons.push(`river discharge ${factors.riverDischargeRatio.toFixed(1)}x normal`);
  }
  if (factors.nearbyDisasterAlert) {
    reasons.push('active disaster alert within 15 km');
  }

  const reason = reasons.join(', ');

  return {
    score: finalScore,
    level,
    reason,
  };
}

/**
 * Assess a single road for flood and landslide risk
 */
export async function assessRoad(
  road: Road,
  customWeatherFetcher?: (lat: number, lng: number) => Promise<{ hourlyRain: number[]; prob: number[] }>
): Promise<RiskAssessmentResult> {
  const coords: LatLng[] = road.coordinates || [];
  if (coords.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      riskReason: 'No coordinates available for risk assessment',
      rainfall24h: 0,
      rainfall48h: 0,
      peakHourlyRain: 0,
      minElevation: null,
      riverDischargeRatio: null,
    };
  }

  // Sample up to 5 points along road polyline
  const samples = samplePointsEvenly(coords, 5);

  // Fetch data in parallel
  const weatherGetter = customWeatherFetcher || fetchPointWeather;
  const weatherResults = await Promise.allSettled(
    samples.map(([lat, lng]) => weatherGetter(lat, lng))
  );
  const elevationResults = await Promise.allSettled(
    samples.map(([lat, lng]) => fetchPointElevation(lat, lng))
  );
  const midPoint = samples[Math.floor(samples.length / 2)];
  const riverRatio = await fetchRiverDischargeRatio(midPoint[0], midPoint[1]);

  // Aggregate rainfall across samples (max worst-case along corridor)
  let max24hRain = 0;
  let max48hRain = 0;
  let maxPeakHourly = 0;
  let maxProb = 0;

  for (const res of weatherResults) {
    if (res.status === 'fulfilled' && res.value) {
      const { hourlyRain, prob } = res.value;
      if (hourlyRain.length > 0) {
        const sum24 = hourlyRain.slice(0, 24).reduce((a, b) => a + b, 0);
        const sum48 = hourlyRain.slice(0, 48).reduce((a, b) => a + b, 0);
        const peak = Math.max(...hourlyRain.slice(0, 48), 0);
        max24hRain = Math.max(max24hRain, sum24);
        max48hRain = Math.max(max48hRain, sum48);
        maxPeakHourly = Math.max(maxPeakHourly, peak);
      }
      if (prob.length > 0) {
        const p = Math.max(...prob.slice(0, 48), 0);
        maxProb = Math.max(maxProb, p);
      }
    }
  }

  // Process elevation
  const elevations: number[] = [];
  for (const res of elevationResults) {
    if (res.status === 'fulfilled' && typeof res.value === 'number') {
      elevations.push(res.value);
    }
  }

  const minElevation = elevations.length > 0 ? Math.min(...elevations) : null;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations) : 0;
  const elevationVariance = elevations.length > 1 ? maxElevation - (minElevation || 0) : 0;

  // Check nearby active Alert within 15km
  let nearbyDisasterAlert = false;
  try {
    const alerts = await Alert.findAll();
    for (const alert of alerts) {
      const text = (alert.title + ' ' + (alert.description || '')).toLowerCase();
      if (text.includes('flood') || text.includes('landslide') || text.includes('rain')) {
        const alertLat = Number(alert.latitude);
        const alertLng = Number(alert.longitude);
        if (!isNaN(alertLat) && !isNaN(alertLng)) {
          const d = haversineDistanceKm([alertLat, alertLng], midPoint);
          if (d <= 15) {
            nearbyDisasterAlert = true;
            break;
          }
        }
      }
    }
  } catch {
    // Ignore alert lookup failure
  }

  const calculation = calculateRiskScore({
    rainfall24h: max24hRain,
    rainfall48h: max48hRain,
    peakHourlyRain: maxPeakHourly,
    precipProbability: maxProb > 0 ? maxProb : 80,
    minElevation,
    elevationVariance,
    riverDischargeRatio: riverRatio,
    nearbyDisasterAlert,
  });

  return {
    riskScore: calculation.score,
    riskLevel: calculation.level,
    riskReason: calculation.reason,
    rainfall24h: Math.round(max24hRain * 10) / 10,
    rainfall48h: Math.round(max48hRain * 10) / 10,
    peakHourlyRain: Math.round(maxPeakHourly * 10) / 10,
    minElevation: minElevation !== null ? Math.round(minElevation) : null,
    riverDischargeRatio: riverRatio !== null ? Math.round(riverRatio * 100) / 100 : null,
  };
}

/**
 * Assess all roads in the database, persist updates, and emit socket events on risk changes
 */
export async function assessAllRoads(
  customWeatherFetcher?: (lat: number, lng: number) => Promise<{ hourlyRain: number[]; prob: number[] }>
): Promise<Road[]> {
  const roads = await Road.findAll();
  const updatedRoads: Road[] = [];

  for (const road of roads) {
    const previousLevel = road.riskLevel;
    const assessment = await assessRoad(road, customWeatherFetcher);

    road.riskScore = assessment.riskScore;
    road.riskLevel = assessment.riskLevel;
    road.riskReason = assessment.riskReason;
    road.rainfall24h = assessment.rainfall24h;
    road.rainfall48h = assessment.rainfall48h;
    road.peakHourlyRain = assessment.peakHourlyRain;
    road.minElevation = assessment.minElevation ?? undefined;
    road.riverDischargeRatio = assessment.riverDischargeRatio ?? undefined;
    road.lastAssessedAt = new Date();

    await road.save();
    updatedRoads.push(road);

    // Emit socket event if risk is high/severe or if risk changed
    if (
      assessment.riskLevel === 'high' ||
      assessment.riskLevel === 'severe' ||
      previousLevel !== assessment.riskLevel
    ) {
      try {
        io?.emit('risk:update', {
          roadId: road.id,
          name: road.name,
          riskLevel: road.riskLevel,
          riskScore: road.riskScore,
          reason: road.riskReason,
        });
      } catch (err: any) {
        console.warn('[RiskService] Socket emit error:', err.message);
      }
    }
  }

  return updatedRoads;
}

export default {
  assessRoad,
  assessAllRoads,
  calculateRiskScore,
  RISK_THRESHOLDS,
};
