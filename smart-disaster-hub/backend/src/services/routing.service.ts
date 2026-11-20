import axios from 'axios';
import env from '../config/env';
import Road from '../models/Road.model';
import { GeoJsonLineString } from '../models/Shipment.model';
import {
  LatLng,
  LngLat,
  lngLatToLatLng,
  latLngToLngLat,
  haversineDistanceKm,
  samplePolylineEveryDistance,
  pointToPolylineDistanceMeters,
} from '../utils/geo';

const REQUEST_TIMEOUT_MS = 8000;
const ROUTE_CACHE_TTL_MS = 10 * 60 * 1000;

export interface RouteOption {
  geometry: GeoJsonLineString;
  distanceKm: number;
  durationMin: number;
  maxRiskScore?: number;
  intersectedRoads?: { id: number; name: string; riskScore: number; riskLevel: string }[];
}

export interface SafestRouteResult {
  safestRoute: RouteOption;
  fastestRoute: RouteOption;
  isRerouted: boolean;
  extraMinutes: number;
  riskReduction: number;
}

// In-memory route cache
interface RouteCacheEntry {
  routes: RouteOption[];
  cachedAt: number;
}
const routeCache = new Map<string, RouteCacheEntry>();

/**
 * Generate fallback direct route between origin and dest when OSRM is offline
 */
function createFallbackRoute(origin: LatLng, dest: LatLng): RouteOption {
  const distKm = haversineDistanceKm(origin, dest) * 1.3; // 30% road winding factor
  const durationMin = Math.round((distKm / 50) * 60); // assume 50 km/h average truck speed

  // Generate 5 intermediate points with small offset
  const points: LngLat[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin[0] + (dest[0] - origin[0]) * t;
    const lng = origin[1] + (dest[1] - origin[1]) * t;
    points.push([lng, lat]);
  }

  return {
    geometry: {
      type: 'LineString',
      coordinates: points,
    },
    distanceKm: Math.round(distKm * 10) / 10,
    durationMin,
  };
}

/**
 * Query OSRM driving service with alternatives=true
 */
export async function getRoutes(origin: LatLng, dest: LatLng): Promise<RouteOption[]> {
  const cacheKey = `${origin[0].toFixed(3)},${origin[1].toFixed(3)};${dest[0].toFixed(3)},${dest[1].toFixed(3)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < ROUTE_CACHE_TTL_MS) {
    return cached.routes;
  }

  const originLngLat = latLngToLngLat(origin);
  const destLngLat = latLngToLngLat(dest);
  const baseUrl = env.OSRM_URL.replace(/\/+$/, '');
  const url = `${baseUrl}/route/v1/driving/${originLngLat[0]},${originLngLat[1]};${destLngLat[0]},${destLngLat[1]}`;

  try {
    const res = await axios.get(url, {
      params: {
        alternatives: 'true',
        geometries: 'geojson',
        overview: 'full',
        steps: 'false',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    if (res.data?.code === 'Ok' && Array.isArray(res.data.routes) && res.data.routes.length > 0) {
      const routes: RouteOption[] = res.data.routes.slice(0, 3).map((r: any) => ({
        geometry: r.geometry,
        distanceKm: Math.round((r.distance / 1000) * 10) / 10,
        durationMin: Math.round(r.duration / 60),
      }));

      routeCache.set(cacheKey, { routes, cachedAt: Date.now() });
      return routes;
    }
  } catch (err: any) {
    console.warn(`[RoutingService] OSRM route fetch failed (${url}): ${err.message}. Using fallback route.`);
  }

  // Graceful offline fallback
  const fallback = [createFallbackRoute(origin, dest)];
  routeCache.set(cacheKey, { routes: fallback, cachedAt: Date.now() });
  return fallback;
}

/**
 * Score a route geometry against known vulnerable roads
 * Checks if the route polyline comes within 300m of any risky road
 */
export async function scoreRoute(routeGeometry: GeoJsonLineString): Promise<{
  maxRiskScore: number;
  intersectedRoads: { id: number; name: string; riskScore: number; riskLevel: string }[];
}> {
  // Convert route coordinates to [lat, lng][]
  const routeLatLng: LatLng[] = (routeGeometry.coordinates || []).map(lngLatToLatLng);
  if (routeLatLng.length === 0) {
    return { maxRiskScore: 0, intersectedRoads: [] };
  }

  // Sample route points every ~500m to balance accuracy and performance
  const sampledRoute = samplePolylineEveryDistance(routeLatLng, 500);

  // Load all roads that have risk >= moderate OR status == 'affected'
  const riskyRoads = await Road.findAll();
  let maxRiskScore = 0;
  const intersectedRoads: { id: number; name: string; riskScore: number; riskLevel: string }[] = [];

  for (const road of riskyRoads) {
    const isAffected = road.status === 'affected';
    const roadRisk = isAffected ? 100 : road.riskScore || 0;
    const roadLevel = isAffected ? 'severe' : road.riskLevel || 'low';

    // Only inspect roads that carry non-trivial hazard
    if (roadRisk < 25 && !isAffected) continue;

    const roadCoords: LatLng[] = road.coordinates || [];
    if (roadCoords.length === 0) continue;

    // Check distance between each sampled route point and road polyline
    let intersects = false;
    for (const pt of sampledRoute) {
      const distM = pointToPolylineDistanceMeters(pt, roadCoords);
      if (distM <= 300) {
        intersects = true;
        break;
      }
    }

    if (intersects) {
      if (roadRisk > maxRiskScore) {
        maxRiskScore = roadRisk;
      }
      intersectedRoads.push({
        id: road.id,
        name: road.name,
        riskScore: roadRisk,
        riskLevel: roadLevel,
      });
    }
  }

  return {
    maxRiskScore,
    intersectedRoads,
  };
}

/**
 * Find the safest route between origin and dest, minimizing (risk penalty + duration)
 */
export async function findSafestRoute(
  origin: LatLng,
  dest: LatLng,
  constraints?: { maxExtraMinutes?: number }
): Promise<SafestRouteResult> {
  const candidateRoutes = await getRoutes(origin, dest);

  // Score each candidate route
  const scoredRoutes: RouteOption[] = [];
  for (const route of candidateRoutes) {
    const scoreInfo = await scoreRoute(route.geometry);
    scoredRoutes.push({
      ...route,
      maxRiskScore: scoreInfo.maxRiskScore,
      intersectedRoads: scoreInfo.intersectedRoads,
    });
  }

  // Identify fastest route
  const fastestRoute = [...scoredRoutes].sort((a, b) => a.durationMin - b.durationMin)[0];
  const maxAllowedExtra = constraints?.maxExtraMinutes ?? 120;

  // Objective function: Score = durationMin + (riskScore * 5)
  // Highly risky roads incur a huge time equivalent penalty (e.g. 80 risk = +400 penalty)
  let bestRoute = fastestRoute;
  let minCost = (fastestRoute.maxRiskScore || 0) * 5 + fastestRoute.durationMin;

  for (const candidate of scoredRoutes) {
    const extraTime = candidate.durationMin - fastestRoute.durationMin;
    if (extraTime > maxAllowedExtra) continue; // exceeds cargo deadline

    const cost = (candidate.maxRiskScore || 0) * 5 + candidate.durationMin;
    if (cost < minCost) {
      minCost = cost;
      bestRoute = candidate;
    }
  }

  const isRerouted = bestRoute !== fastestRoute && (bestRoute.maxRiskScore || 0) < (fastestRoute.maxRiskScore || 0);
  const extraMinutes = Math.max(0, bestRoute.durationMin - fastestRoute.durationMin);
  const riskReduction = Math.max(0, (fastestRoute.maxRiskScore || 0) - (bestRoute.maxRiskScore || 0));

  return {
    safestRoute: bestRoute,
    fastestRoute,
    isRerouted,
    extraMinutes,
    riskReduction,
  };
}

export default {
  getRoutes,
  scoreRoute,
  findSafestRoute,
};
