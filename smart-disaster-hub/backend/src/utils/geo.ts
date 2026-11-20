/**
 * Geographic Utility Module
 * Explicit conversions between Road [lat, lng] and GeoJSON/OSRM [lng, lat]
 * Distance and spatial projection helpers
 */

export type LatLng = [number, number]; // [latitude, longitude]
export type LngLat = [number, number]; // [longitude, latitude]

/**
 * Converts a [lat, lng] coordinate to [lng, lat] (GeoJSON / OSRM format)
 */
export function latLngToLngLat(coord: LatLng): LngLat {
  return [coord[1], coord[0]];
}

/**
 * Converts a [lng, lat] coordinate to [lat, lng] (Road model / Leaflet format)
 */
export function lngLatToLatLng(coord: LngLat): LatLng {
  return [coord[1], coord[0]];
}

export function latLngListToLngLat(coords: LatLng[]): LngLat[] {
  return coords.map(latLngToLngLat);
}

export function lngLatListToLatLng(coords: LngLat[]): LatLng[] {
  return coords.map(lngLatToLatLng);
}

/**
 * Calculate Great-Circle distance between two [lat, lng] points in Kilometers
 */
export function haversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
  return haversineDistanceKm(p1, p2) * 1000;
}

/**
 * Distance in meters from point P to segment [A, B]
 */
export function pointToSegmentDistanceMeters(
  point: LatLng,
  segA: LatLng,
  segB: LatLng
): number {
  // Approximate planar projection using cosine of average latitude
  const latFactor = Math.PI / 180;
  const avgLat = ((segA[0] + segB[0] + point[0]) / 3) * latFactor;
  const cosLat = Math.cos(avgLat);

  // Convert degrees to meters roughly: 1 deg lat ≈ 111,320m, 1 deg lon ≈ 111,320m * cos(lat)
  const degToM = 111320;
  const ax = segA[1] * degToM * cosLat;
  const ay = segA[0] * degToM;
  const bx = segB[1] * degToM * cosLat;
  const by = segB[0] * degToM;
  const px = point[1] * degToM * cosLat;
  const py = point[0] * degToM;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  // Projection scalar t onto line AB clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.hypot(px - projX, py - projY);
}

/**
 * Minimum distance in meters from point to polyline (given as [lat, lng][])
 */
export function pointToPolylineDistanceMeters(
  point: LatLng,
  polyline: LatLng[]
): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineDistanceMeters(point, polyline[0]);

  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = pointToSegmentDistanceMeters(point, polyline[i], polyline[i + 1]);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

/**
 * Sample up to `maxCount` points evenly across an array
 */
export function samplePointsEvenly<T>(arr: T[], maxCount: number = 5): T[] {
  if (arr.length <= maxCount) return [...arr];
  if (maxCount <= 1) return [arr[0]];

  const result: T[] = [];
  const step = (arr.length - 1) / (maxCount - 1);
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.min(arr.length - 1, Math.round(i * step));
    result.push(arr[idx]);
  }
  return result;
}

/**
 * Sample polyline points approximately every `stepMeters` (default 500m)
 */
export function samplePolylineEveryDistance(
  coords: LatLng[],
  stepMeters: number = 500
): LatLng[] {
  if (coords.length <= 1) return coords;

  const result: LatLng[] = [coords[0]];
  let accumulatedDist = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const segDist = haversineDistanceMeters(p1, p2);

    if (segDist === 0) continue;

    let d = stepMeters - accumulatedDist;
    while (d <= segDist) {
      const frac = d / segDist;
      const sampledLat = p1[0] + (p2[0] - p1[0]) * frac;
      const sampledLng = p1[1] + (p2[1] - p1[1]) * frac;
      result.push([sampledLat, sampledLng]);
      d += stepMeters;
    }

    accumulatedDist = (accumulatedDist + segDist) % stepMeters;
  }

  // Ensure last point is included
  const last = coords[coords.length - 1];
  if (result[result.length - 1] !== last) {
    result.push(last);
  }

  return result;
}

/**
 * Interpolate a point [lat, lng] along GeoJSON [lng, lat][] coordinates given progress 0..1
 */
export function interpolateAlongLngLatLineString(
  lineStringLngLat: LngLat[],
  progress: number
): LatLng {
  if (!lineStringLngLat || lineStringLngLat.length === 0) {
    return [0, 0];
  }
  if (lineStringLngLat.length === 1 || progress <= 0) {
    return lngLatToLatLng(lineStringLngLat[0]);
  }
  if (progress >= 1) {
    return lngLatToLatLng(lineStringLngLat[lineStringLngLat.length - 1]);
  }

  // Calculate cumulative distances
  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 0; i < lineStringLngLat.length - 1; i++) {
    const p1 = lngLatToLatLng(lineStringLngLat[i]);
    const p2 = lngLatToLatLng(lineStringLngLat[i + 1]);
    const d = haversineDistanceKm(p1, p2);
    totalDist += d;
    distances.push(totalDist);
  }

  if (totalDist === 0) {
    return lngLatToLatLng(lineStringLngLat[0]);
  }

  const targetDist = progress * totalDist;
  for (let i = 0; i < distances.length - 1; i++) {
    if (targetDist >= distances[i] && targetDist <= distances[i + 1]) {
      const segLen = distances[i + 1] - distances[i];
      const frac = segLen === 0 ? 0 : (targetDist - distances[i]) / segLen;
      const p1 = lngLatToLatLng(lineStringLngLat[i]);
      const p2 = lngLatToLatLng(lineStringLngLat[i + 1]);
      return [p1[0] + (p2[0] - p1[0]) * frac, p1[1] + (p2[1] - p1[1]) * frac];
    }
  }

  return lngLatToLatLng(lineStringLngLat[lineStringLngLat.length - 1]);
}
