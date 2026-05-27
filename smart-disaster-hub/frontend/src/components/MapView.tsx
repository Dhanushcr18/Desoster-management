import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// ─── Road data structure ──────────────────────────────────────────────────────
interface Road {
  id: number;
  name: string;
  coordinates: [number, number][];
  status: 'affected' | 'alternate' | 'normal';
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}


// ─── Coordinate helper ───────────────────────────────────────────────────────
function getLatLng(alert: any): [number, number] | null {
  try {
    let lat: number | undefined, lng: number | undefined;
    if (alert.geometry?.coordinates?.length >= 2) {
      lng = parseFloat(alert.geometry.coordinates[0]);
      lat = parseFloat(alert.geometry.coordinates[1]);
    } else if (alert.latitude != null && alert.longitude != null) {
      lat = parseFloat(alert.latitude);
      lng = parseFloat(alert.longitude);
    }
    if (lat != null && lng != null && isFinite(lat) && isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
  } catch { /* skip */ }
  return null;
}

// ─── Alert type → emoji mapping ──────────────────────────────────────────────
function getAlertEmoji(alert: any): string {
  const type = (alert.alertType || '').toLowerCase();
  const title = (alert.title || '').toLowerCase();
  if (type.includes('earthquake') || title.includes('earthquake')) return '🌍';
  if (type.includes('flood') || title.includes('flood') || title.includes('rain')) return '🌊';
  if (type.includes('fire') || title.includes('fire')) return '🔥';
  if (type.includes('cyclone') || type.includes('storm') || title.includes('cyclone') || title.includes('storm') || title.includes('thunder')) return '🌀';
  if (type.includes('heatwave') || title.includes('heat') || title.includes('temperature')) return '🌡️';
  if (type.includes('windstorm') || title.includes('wind')) return '💨';
  if (type.includes('security') || title.includes('security') || title.includes('critical')) return '🚨';
  if (type.includes('pollution') || title.includes('air quality') || title.includes('aqi')) return '💨';
  if (type.includes('accident') || title.includes('traffic') || title.includes('accident')) return '⚠️';
  if (type.includes('building') || title.includes('building') || title.includes('collapse')) return '🏚️';
  if (type.includes('tsunami') || title.includes('tsunami')) return '🌊';
  if (type.includes('volcano') || title.includes('volcano')) return '🌋';
  if (type.includes('landslide') || title.includes('landslide')) return '⛰️';
  return '⚠️';
}

// ─── Severity colors ─────────────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  critical: { bg: '#7c3aed', ring: '#a78bfa', text: '#fff' },
  high:     { bg: '#ef4444', ring: '#fca5a5', text: '#fff' },
  medium:   { bg: '#f59e0b', ring: '#fde68a', text: '#fff' },
  low:      { bg: '#3b82f6', ring: '#93c5fd', text: '#fff' },
};

function getSeverityStyle(severity: string) {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
}

// ─── Custom pulsing marker icon ───────────────────────────────────────────────
function createDisasterIcon(alert: any): L.DivIcon {
  const emoji = getAlertEmoji(alert);
  const style = getSeverityStyle(alert.severity);
  const isRealWorld = !!alert.alertType;
  const pulse = alert.severity === 'high' || alert.severity === 'critical';

  return L.divIcon({
    className: '',
    iconSize: [48, 58],
    iconAnchor: [24, 54],
    popupAnchor: [0, -54],
    html: `
      <div style="position:relative; width:48px; height:58px;">
        ${pulse ? `
          <div style="
            position:absolute; top:4px; left:4px;
            width:40px; height:40px; border-radius:50%;
            background:${style.ring}; opacity:0.5;
            animation: pulse-ring 1.6s ease-out infinite;
          "></div>` : ''}
        <div style="
          position:absolute; top:0; left:0;
          width:48px; height:48px; border-radius:50% 50% 50% 0%;
          transform: rotate(-45deg);
          background: ${style.bg};
          box-shadow: 0 4px 15px rgba(0,0,0,0.35);
          border: 3px solid white;
        "></div>
        <div style="
          position:absolute; top:0; left:0;
          width:48px; height:48px;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; line-height:1;
        ">${emoji}</div>
        ${isRealWorld ? `
          <div style="
            position:absolute; top:-4px; right:-4px;
            width:16px; height:16px; border-radius:50%;
            background:#22c55e; border:2px solid white;
            animation: live-blink 1s ease-in-out infinite;
          "></div>` : ''}
      </div>
      <style>
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes live-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      </style>
    `,
  });
}

// ─── Auto-fit bounds ──────────────────────────────────────────────────────────
function MapUpdater({ alerts }: { alerts: any[] }) {
  const map = useMap();
  const initialFit = useRef(false);

  useEffect(() => {
    if (initialFit.current) return;
    const positions = alerts.map(getLatLng).filter((p): p is [number, number] => p !== null);
    if (positions.length > 0) {
      try {
        const bounds = L.latLngBounds(positions);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
          initialFit.current = true;
        }
      } catch { /* skip */ }
    }
  }, [alerts, map]);

  return null;
}

// ─── Time helper ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
}

// ─── Main component ──────────────────────────────────────────────────────────
interface MapViewProps {
  alerts: any[];
  onAlertClick: (alert: any) => void;
}

export default function MapView({ alerts, onAlertClick }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showRealWorld, setShowRealWorld] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'dark'>('dark');
  const [showAffectedRoads, setShowAffectedRoads] = useState(true);
  const [showAlternateRoads, setShowAlternateRoads] = useState(true);
  const [roads, setRoads] = useState<Road[]>([]);
  const [loadingRoads, setLoadingRoads] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  // Fetch roads from API
  useEffect(() => {
    const fetchRoads = async () => {
      try {
        setLoadingRoads(true);
        const response = await axios.get('http://localhost:3001/api/roads/all');
        const roadsData = response.data.map((road: any) => ({
          id: road.id,
          name: road.name,
          coordinates: road.coordinates,
          status: road.status,
          description: road.description,
          severity: road.severity,
        }));
        setRoads(roadsData);
      } catch (error) {
        console.error('Error fetching roads:', error);
        // Silently fail - UI will just show no roads
      } finally {
        setLoadingRoads(false);
      }
    };

    fetchRoads();
  }, []);

  // Filter by layer toggles
  const visibleAlerts = alerts.filter(a => {
    const isRealWorld = !!a.alertType;
    if (isRealWorld && !showRealWorld) return false;
    if (!isRealWorld && !showCommunity) return false;
    return true;
  });

  const validAlerts = visibleAlerts.filter(a => getLatLng(a) !== null);

  const realWorldCount = alerts.filter(a => !!a.alertType).length;
  const communityCount = alerts.filter(a => !a.alertType).length;

  const defaultCenter: [number, number] = userLocation || [20.5937, 78.9629];

  // Map tile URLs
  const tileLayers: Record<string, { url: string; attr: string }> = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: '© <a href="https://carto.com/">CARTO</a>',
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '© Esri, Maxar, Earthstar Geographics',
    },
  };

  const tile = tileLayers[mapStyle];

  return (
    <div className="relative h-full w-full">
      {/* ── Floating Control Panel ── */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Live status badge */}
        <div style={{
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 0 0 #22c55e',
            animation: 'live-blink 1s ease-in-out infinite',
          }}/>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
            LIVE — {validAlerts.length} Alerts
          </span>
        </div>

        {/* Layer toggles */}
        <div style={{
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '10px 12px',
          display: 'flex', flexDirection: 'column', gap: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          minWidth: 180,
        }}>
          <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Data Layers
          </div>

          {/* Real-world toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setShowRealWorld(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: showRealWorld ? '#22c55e' : '#4b5563',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: showRealWorld ? 18 : 3,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }}/>
            </div>
            <span style={{ color: '#d1fae5', fontSize: 12, fontWeight: 600 }}>
              🌍 Real-World ({realWorldCount})
            </span>
          </label>

          {/* Community toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setShowCommunity(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: showCommunity ? '#f59e0b' : '#4b5563',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: showCommunity ? 18 : 3,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }}/>
            </div>
            <span style={{ color: '#fef3c7', fontSize: 12, fontWeight: 600 }}>
              👥 Community ({communityCount})
            </span>
          </label>

          {/* Affected roads toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setShowAffectedRoads(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: showAffectedRoads ? '#ef4444' : '#4b5563',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: showAffectedRoads ? 18 : 3,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }}/>
            </div>
            <span style={{ color: '#fecaca', fontSize: 12, fontWeight: 600 }}>
              🚫 Affected Roads
            </span>
          </label>

          {/* Alternate roads toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              onClick={() => setShowAlternateRoads(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: showAlternateRoads ? '#22c55e' : '#4b5563',
                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: showAlternateRoads ? 18 : 3,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }}/>
            </div>
            <span style={{ color: '#bbf7d0', fontSize: 12, fontWeight: 600 }}>
              ✅ Alternate Routes
            </span>
          </label>
        </div>

        {/* Map style switcher */}
        <div style={{
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: '8px 10px',
          display: 'flex', gap: 6,
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {(['dark', 'street', 'satellite'] as const).map(s => (
            <button
              key={s}
              onClick={() => setMapStyle(s)}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: mapStyle === s ? '#6366f1' : 'rgba(255,255,255,0.1)',
                color: mapStyle === s ? '#fff' : '#9ca3af',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {s === 'dark' ? '🌑' : s === 'satellite' ? '🛰️' : '🗺️'} {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Severity Legend ── */}
      <div style={{
        position: 'absolute', bottom: 28, left: 12, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        borderRadius: 12, padding: '10px 14px',
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Severity & Roads
        </div>
        {[
          { label: 'Critical', color: '#7c3aed', emoji: '🔴' },
          { label: 'High', color: '#ef4444', emoji: '🟠' },
          { label: 'Medium', color: '#f59e0b', emoji: '🟡' },
          { label: 'Low', color: '#3b82f6', emoji: '🔵' },
        ].map(({ label, color, emoji }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }}/>
            <span style={{ color: '#e5e7eb', fontSize: 12 }}>{emoji} {label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}/>
            <span style={{ color: '#86efac', fontSize: 11 }}>● Live Real-World Data</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 16, height: 3, background: '#ef4444' }}/>
            <span style={{ color: '#fecaca', fontSize: 11 }}>🚫 Affected Road</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 3, background: '#22c55e' }}/>
            <span style={{ color: '#bbf7d0', fontSize: 11 }}>✅ Alternate Route</span>
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={defaultCenter}
        zoom={4}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={tile.url} attribution={tile.attr} />
        <ZoomControl position="bottomright" />
        <MapUpdater alerts={validAlerts} />

        {/* Roads - Affected (Red) */}
        {showAffectedRoads && roads.filter(r => r.status === 'affected').map(road => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{
              color: '#ef4444',
              weight: 6,
              opacity: 1,
              dashArray: '8,4',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                <strong>🚫 {road.name}</strong>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
                  {road.description || 'This road is affected by a disaster'}
                </p>
                {road.severity && (
                  <p style={{ margin: '4px 0', fontSize: 11, color: '#999' }}>
                    Severity: {road.severity.toUpperCase()}
                  </p>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Roads - Alternate (Green) */}
        {showAlternateRoads && roads.filter(r => r.status === 'alternate').map(road => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{
              color: '#22c55e',
              weight: 6,
              opacity: 1,
              dashArray: '0',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                <strong>✅ {road.name}</strong>
                <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
                  {road.description || 'Safe alternate route available'}
                </p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              html: `
                <div style="
                  width:20px; height:20px; border-radius:50%;
                  background:#3b82f6; border:3px solid white;
                  box-shadow: 0 0 0 6px rgba(59,130,246,0.3);
                  animation: pulse-ring 1.6s ease-out infinite;
                "></div>
              `,
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                <strong>📍 Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Alert markers */}
        {validAlerts.map((alert) => {
          const pos = getLatLng(alert)!;
          const id = alert._id || alert.id || Math.random().toString(36);
          const isRealWorld = !!alert.alertType;
          const style = getSeverityStyle(alert.severity);

          return (
            <Marker
              key={id}
              position={pos}
              icon={createDisasterIcon(alert)}
              eventHandlers={{ click: () => onAlertClick(alert) }}
            >
              <Popup maxWidth={300} minWidth={240}>
                <div style={{ fontFamily: 'system-ui, sans-serif', padding: 4 }}>
                  {/* Header */}
                  <div style={{
                    background: style.bg, borderRadius: 8,
                    padding: '8px 10px', marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 22 }}>{getAlertEmoji(alert)}</span>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                        {alert.title}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                        {alert.severity?.toUpperCase()} • {timeAgo(alert.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ color: '#374151', fontSize: 12, lineHeight: 1.5, margin: '0 0 8px 0' }}>
                    {(alert.description || '').substring(0, 150)}{(alert.description || '').length > 150 ? '…' : ''}
                  </p>

                  {/* Source badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{
                      background: isRealWorld ? '#dcfce7' : '#fef3c7',
                      color: isRealWorld ? '#15803d' : '#92400e',
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    }}>
                      {isRealWorld ? '🌍 Live Data' : '👥 Community'}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: 10 }}>
                      📍 {alert.source || 'Unknown Source'}
                    </span>
                  </div>

                  {/* Community stats */}
                  {alert.reportStats && (
                    <div style={{
                      display: 'flex', gap: 8, marginTop: 8,
                      borderTop: '1px solid #e5e7eb', paddingTop: 8,
                    }}>
                      <div style={{
                        flex: 1, background: '#f0fdf4', borderRadius: 6,
                        padding: '4px 8px', textAlign: 'center',
                      }}>
                        <div style={{ color: '#16a34a', fontWeight: 800, fontSize: 16 }}>
                          {alert.reportStats.safe || 0}
                        </div>
                        <div style={{ color: '#15803d', fontSize: 10 }}>✅ Safe</div>
                      </div>
                      <div style={{
                        flex: 1, background: '#fff7ed', borderRadius: 6,
                        padding: '4px 8px', textAlign: 'center',
                      }}>
                        <div style={{ color: '#ea580c', fontWeight: 800, fontSize: 16 }}>
                          {alert.reportStats.help || 0}
                        </div>
                        <div style={{ color: '#c2410c', fontSize: 10 }}>🆘 Need Help</div>
                      </div>
                    </div>
                  )}

                  {/* Click hint */}
                  <button
                    onClick={() => onAlertClick(alert)}
                    style={{
                      width: '100%', marginTop: 8,
                      background: style.bg, color: '#fff',
                      border: 'none', borderRadius: 8, padding: '6px 12px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    View Full Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* No visible alerts notice */}
      {validAlerts.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          borderRadius: 16, padding: '24px 32px',
          textAlign: 'center', zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>No alerts visible</div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>Toggle a layer above to show alerts</div>
        </div>
      )}
    </div>
  );
}
