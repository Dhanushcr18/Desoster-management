import {
  LatLng,
  LngLat,
  latLngToLngLat,
  lngLatToLatLng,
  haversineDistanceKm,
  pointToSegmentDistanceMeters,
  samplePointsEvenly,
  samplePolylineEveryDistance,
  interpolateAlongLngLatLineString,
} from '../src/utils/geo';

describe('Geo Utilities and Coordinate Conversions', () => {
  it('should correctly convert [lat, lng] to [lng, lat] and back', () => {
    const latLng: LatLng = [12.9716, 77.5946];
    const lngLat: LngLat = latLngToLngLat(latLng);

    expect(lngLat[0]).toBe(77.5946);
    expect(lngLat[1]).toBe(12.9716);

    const reverted = lngLatToLatLng(lngLat);
    expect(reverted[0]).toBe(latLng[0]);
    expect(reverted[1]).toBe(latLng[1]);
  });

  it('should accurately calculate Haversine distance between cities', () => {
    // Bengaluru (12.9716, 77.5946) to Mysuru (12.2958, 76.6394) is ~128 - 140 km as the crow flies
    const blr: LatLng = [12.9716, 77.5946];
    const mys: LatLng = [12.2958, 76.6394];
    const dist = haversineDistanceKm(blr, mys);

    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(150);
  });

  it('should compute point to line segment distance accurately', () => {
    // Segment along equator from [0, 0] to [0, 1]
    const p1: LatLng = [0, 0];
    const p2: LatLng = [0, 1];
    // Point slightly north of midpoint
    const testPoint: LatLng = [0.01, 0.5]; // ~1.11 km north
    const distMeters = pointToSegmentDistanceMeters(testPoint, p1, p2);

    expect(distMeters).toBeGreaterThan(1000);
    expect(distMeters).toBeLessThan(1250);
  });

  it('should evenly sample requested number of points along an array', () => {
    const points: LatLng[] = [
      [10, 20],
      [11, 21],
      [12, 22],
      [13, 23],
      [14, 24],
      [15, 25],
      [16, 26],
      [17, 27],
      [18, 28],
    ];

    const sampled = samplePointsEvenly(points, 5);
    expect(sampled.length).toBe(5);
    expect(sampled[0]).toEqual(points[0]);
    expect(sampled[4]).toEqual(points[points.length - 1]);
  });

  it('should sample polyline with distance steps', () => {
    const coords: LatLng[] = [
      [12.97, 77.59],
      [12.98, 77.60],
      [12.99, 77.61],
    ];

    const sampled = samplePolylineEveryDistance(coords, 500);
    expect(sampled.length).toBeGreaterThanOrEqual(coords.length);
  });

  it('should interpolate coordinate along GeoJSON route with progress 0..1', () => {
    const route: LngLat[] = [
      [77.5946, 12.9716], // BLR
      [76.6394, 12.2958], // MYS
    ];

    const start = interpolateAlongLngLatLineString(route, 0.0);
    expect(start[0]).toBeCloseTo(12.9716, 3);

    const mid = interpolateAlongLngLatLineString(route, 0.5);
    expect(mid[0]).toBeGreaterThan(12.29);
    expect(mid[0]).toBeLessThan(12.98);

    const end = interpolateAlongLngLatLineString(route, 1.0);
    expect(end[0]).toBeCloseTo(12.2958, 3);
  });
});
