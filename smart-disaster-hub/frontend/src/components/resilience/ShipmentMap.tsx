import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shipment, RoadRisk, Warehouse } from '../../types';

interface ShipmentMapProps {
  shipments: Shipment[];
  roads: RoadRisk[];
  warehouses: Warehouse[];
  selectedShipmentId?: number | null;
  onSelectShipment?: (shipment: Shipment) => void;
}

// Convert GeoJSON [lng, lat][] to Leaflet [lat, lng][]
function geoJsonToLeafletCoords(coordinates: [number, number][]): [number, number][] {
  if (!coordinates) return [];
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function getCargoEmoji(type: string): string {
  switch (type) {
    case 'medicine':
      return '💊';
    case 'food':
      return '🍞';
    case 'fuel':
      return '⛽';
    case 'water':
      return '💧';
    default:
      return '📦';
  }
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'severe':
      return '#ef4444'; // Red
    case 'high':
      return '#f97316'; // Orange
    case 'moderate':
      return '#eab308'; // Amber
    case 'low':
    default:
      return '#10b981'; // Emerald
  }
}

function createTruckIcon(shipment: Shipment, isSelected: boolean): L.DivIcon {
  const emoji = getCargoEmoji(shipment.cargoType);
  const isRerouted = shipment.status === 'rerouted';
  const isAtRisk = shipment.status === 'at_risk';
  const isHeld = shipment.status === 'held';

  let borderColor = '#3b82f6';
  let bgColor = '#1e293b';

  if (isRerouted) {
    borderColor = '#06b6d4'; // Cyan
    bgColor = '#0f172a';
  } else if (isAtRisk) {
    borderColor = '#ef4444'; // Red
  } else if (isHeld) {
    borderColor = '#f59e0b'; // Amber
  }

  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        background: ${bgColor};
        border: ${isSelected ? '3px solid #fbbf24' : `2px solid ${borderColor}`};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${emoji}
        ${
          isRerouted
            ? `<span style="
                position: absolute;
                top: -4px;
                right: -4px;
                width: 10px;
                height: 10px;
                background: #06b6d4;
                border-radius: 50%;
                border: 2px solid white;
              "></span>`
            : ''
        }
      </div>
    `,
  });
}

function createWarehouseIcon(type: string): L.DivIcon {
  const iconEmoji = type === 'hospital' ? '🏥' : type === 'relief_camp' ? '⛺' : '🏢';

  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: #0f172a;
        border: 2px solid #64748b;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${iconEmoji}
      </div>
    `,
  });
}

export const ShipmentMap: React.FC<ShipmentMapProps> = ({
  shipments,
  roads,
  warehouses,
  selectedShipmentId,
  onSelectShipment,
}) => {
  // Center of South India corridor (between Bengaluru, Kerala, and Tamil Nadu)
  const defaultCenter: [number, number] = [11.8, 76.8];

  const memoizedRoads = useMemo(() => {
    return roads.map((road) => {
      const color = getRiskColor(road.riskLevel);
      return (
        <Polyline
          key={`road-${road.id}`}
          positions={road.coordinates}
          pathOptions={{
            color,
            weight: road.riskLevel === 'severe' || road.riskLevel === 'high' ? 6 : 4,
            opacity: 0.85,
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px] text-slate-900">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm">{road.name}</span>
                <span
                  className="px-2 py-0.5 text-xs font-semibold rounded uppercase"
                  style={{
                    backgroundColor: `${color}25`,
                    color,
                    border: `1px solid ${color}`,
                  }}
                >
                  {road.riskLevel}
                </span>
              </div>
              <div className="text-xs text-slate-600 mb-1">
                <strong>Flood/Landslide Risk Score:</strong> {road.riskScore}%
              </div>
              {road.rainfall48h !== undefined && (
                <div className="text-xs text-slate-600 mb-1">
                  <strong>48h Rainfall:</strong> {road.rainfall48h} mm (peak {road.peakHourlyRain} mm/h)
                </div>
              )}
              {road.minElevation !== undefined && road.minElevation !== null && (
                <div className="text-xs text-slate-600 mb-1">
                  <strong>Elevation:</strong> {road.minElevation} m
                </div>
              )}
              {road.riskReason && (
                <div className="mt-2 text-xs bg-slate-100 p-2 rounded text-slate-700 italic border border-slate-200">
                  {road.riskReason}
                </div>
              )}
            </div>
          </Popup>
        </Polyline>
      );
    });
  }, [roads]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        className="w-full h-full"
        style={{ minHeight: '520px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Road Risk Polylines */}
        {memoizedRoads}

        {/* 2. Warehouses */}
        {warehouses.map((wh) => (
          <Marker
            key={`wh-${wh.id}`}
            position={[wh.lat, wh.lng]}
            icon={createWarehouseIcon(wh.type)}
          >
            <Popup>
              <div className="p-2 text-slate-900">
                <div className="font-bold text-sm">{wh.name}</div>
                <div className="text-xs text-slate-500 capitalize">{wh.city}, {wh.state} ({wh.type})</div>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -16]}>
              <span className="font-semibold text-xs">{wh.city}</span>
            </Tooltip>
          </Marker>
        ))}

        {/* 3. Shipments */}
        {shipments.map((shipment) => {
          const isSelected = selectedShipmentId === shipment.id;
          const isRerouted = shipment.status === 'rerouted';
          const originalCoords = geoJsonToLeafletCoords(shipment.originalRoute?.coordinates);
          const activeCoords = geoJsonToLeafletCoords(shipment.activeRoute?.coordinates);

          return (
            <React.Fragment key={`shipment-grp-${shipment.id}`}>
              {/* If rerouted, draw original route as dashed grey line */}
              {isRerouted && originalCoords.length > 0 && (
                <Polyline
                  positions={originalCoords}
                  pathOptions={{
                    color: '#94a3b8',
                    dashArray: '6, 8',
                    weight: 3,
                    opacity: 0.6,
                  }}
                />
              )}

              {/* Active Route */}
              {activeCoords.length > 0 && (
                <Polyline
                  positions={activeCoords}
                  pathOptions={{
                    color: isRerouted ? '#0284c7' : '#6366f1',
                    weight: isSelected ? 5 : 3.5,
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Moving Truck Marker */}
              <Marker
                position={[shipment.currentLat, shipment.currentLng]}
                icon={createTruckIcon(shipment, isSelected)}
                eventHandlers={{
                  click: () => onSelectShipment && onSelectShipment(shipment),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[220px] text-slate-900">
                    <div className="flex items-center justify-between gap-2 border-b pb-1 mb-2">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-1">
                        {getCargoEmoji(shipment.cargoType)} {shipment.code}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          isRerouted
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                            : shipment.status === 'held'
                            ? 'bg-amber-100 text-amber-800'
                            : shipment.status === 'at_risk'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700">
                      <div>
                        <strong>Cargo:</strong> {shipment.cargoType} ({shipment.priority})
                      </div>
                      <div>
                        <strong>Driver:</strong> {shipment.driverName}
                      </div>
                      <div>
                        <strong>ETA:</strong> ~{shipment.etaMinutes} mins remaining
                      </div>
                      <div>
                        <strong>Progress:</strong> {Math.round(shipment.progress * 100)}%
                      </div>
                    </div>

                    {isRerouted && (
                      <div className="mt-2 text-xs bg-cyan-50 text-cyan-900 p-2 rounded border border-cyan-200">
                        ⚡ <strong>Autonomous Reroute:</strong> Diverted via alternate corridor to avoid ahead flood hazard.
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 text-xs text-white shadow-xl pointer-events-auto max-w-[240px]">
        <div className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <span>Map Corridor Legend</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Severe Risk (≥75)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-orange-500"></span>
            <span>High Risk (50-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-yellow-500"></span>
            <span>Moderate Risk (25-49)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Low Risk (&lt;25)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400"></span>
            <span>Original Planned Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 rounded-full bg-cyan-500"></span>
            <span>Active Proactive Reroute</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentMap;
