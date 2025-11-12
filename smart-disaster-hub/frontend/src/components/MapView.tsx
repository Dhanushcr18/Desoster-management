import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Alert } from '../types';
import { AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

// Component to recenter map when alerts change
function MapUpdater({ alerts }: { alerts: Alert[] }) {
  const map = useMap();

  useEffect(() => {
    if (alerts.length > 0) {
      const bounds = L.latLngBounds(
        alerts.map(a => [a.geometry.coordinates[1], a.geometry.coordinates[0]])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [alerts, map]);

  return null;
}

export default function MapView({ alerts, onAlertClick }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const defaultCenter: [number, number] = userLocation || [37.7749, -122.4194]; // San Francisco

  // Create custom icons based on severity
  const createIcon = (severity: string) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#3b82f6'
    };

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${colors[severity as keyof typeof colors]};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">
          !
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <div className="relative h-full">
      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {alerts.map((alert) => (
          <Marker
            key={alert._id}
            position={[alert.geometry.coordinates[1], alert.geometry.coordinates[0]]}
            icon={createIcon(alert.severity)}
            eventHandlers={{
              click: () => onAlertClick(alert)
            }}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold mb-1">{alert.title}</h3>
                <p className="text-xs text-gray-600 mb-1">{alert.description.substring(0, 100)}...</p>
                <span className={`text-xs font-semibold uppercase ${
                  alert.severity === 'high' ? 'text-red-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {alert.severity} priority
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater alerts={alerts} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h3 className="font-semibold text-sm mb-2">Alert Severity</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-xs">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-xs">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-xs">Low Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
}
