import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteData {
  id: string;
  name: string;
  path: Array<{ lat: number; lng: number }>;
  type: 'safe' | 'danger';
  distance?: number;
  eta?: string;
  riskLevel?: string;
  status?: string;
}

interface GoogleMapsRouteViewerProps {
  routes: RouteData[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Auto-fit bounds component
function MapFitter({ routes }: { routes: RouteData[] }) {
  const map = useMap();

  useEffect(() => {
    if (routes.length === 0) return;

    const allPoints: [number, number][] = [];
    routes.forEach((route) => {
      route.path.forEach((point) => {
        allPoints.push([point.lat, point.lng]);
      });
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }
  }, [routes, map]);

  return null;
}

export default function GoogleMapsRouteViewer({
  routes,
  center = { lat: 26.1798, lng: 91.7519 },
  zoom = 7,
}: GoogleMapsRouteViewerProps) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 rounded-lg">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      >
        {/* Dark themed map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {/* Auto-fit to routes */}
        <MapFitter routes={routes} />

        {/* Render routes as polylines */}
        {routes.map((route) => {
          const color = route.type === 'safe' ? '#10b981' : '#ef4444';
          const path: [number, number][] = route.path.map((p) => [p.lat, p.lng]);

          return (
            <React.Fragment key={route.id}>
              {/* Main polyline */}
              <Polyline
                positions={path}
                color={color}
                weight={5}
                opacity={0.8}
                lineCap="round"
                lineJoin="round"
              >
                <Popup>
                  <div style={{ minWidth: '220px', fontFamily: 'system-ui' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>
                      {route.name}
                    </h3>
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: route.type === 'safe' ? '#d1fae5' : '#fee2e2',
                          color: route.type === 'safe' ? '#065f46' : '#7f1d1d',
                        }}
                      >
                        {route.type === 'safe' ? '✅ SAFE ROUTE' : '🔴 DANGER ROUTE'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                      {route.distance && <div><strong>Distance:</strong> {route.distance} km</div>}
                      {route.eta && <div><strong>ETA:</strong> {route.eta}</div>}
                      {route.riskLevel && <div><strong>Risk Level:</strong> {route.riskLevel}</div>}
                      {route.status && <div><strong>Status:</strong> {route.status}</div>}
                    </div>
                  </div>
                </Popup>
              </Polyline>

              {/* Start marker */}
              <Marker
                position={[path[0][0], path[0][1]]}
                icon={L.divIcon({
                  className: '',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  html: `
                    <div style="
                      width: 32px;
                      height: 32px;
                      background: ${route.type === 'safe' ? '#10b981' : '#ef4444'};
                      border: 3px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 16px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    ">
                      ${route.type === 'safe' ? '✅' : '⚠️'}
                    </div>
                  `,
                })}
              >
                <Popup>Start Point - {route.type === 'safe' ? 'Safe' : 'Blocked'}</Popup>
              </Marker>

              {/* End marker */}
              <Marker
                position={[path[path.length - 1][0], path[path.length - 1][1]]}
                icon={L.divIcon({
                  className: '',
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  html: `
                    <div style="
                      width: 32px;
                      height: 32px;
                      background: ${route.type === 'safe' ? '#10b981' : '#ef4444'};
                      border: 3px solid white;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 16px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    ">
                      ${route.type === 'safe' ? '🎯' : '🚫'}
                    </div>
                  `,
                })}
              >
                <Popup>End Point - {route.type === 'safe' ? 'Safe' : 'Blocked'}</Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: 16,
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Route Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 4, background: '#10b981', borderRadius: 2 }} />
            <span style={{ color: '#d1fae5', fontSize: 12, whiteSpace: 'nowrap' }}>Safe Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 4, background: '#ef4444', borderRadius: 2 }} />
            <span style={{ color: '#fca5a5', fontSize: 12, whiteSpace: 'nowrap' }}>Danger Road</span>
          </div>
        </div>
      </div>
    </div>
  );
}
