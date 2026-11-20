import React, { useEffect, useState } from 'react';
import GoogleMapsRouteViewer from './GoogleMapsRouteViewer';
import { ArrowRight, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RouteData {
  id: string;
  name: string;
  path: Array<{ lat: number; lng: number }>;
  type: 'safe' | 'danger';
  distance?: number;
  eta?: string;
  riskLevel?: string;
  status?: string;
  waypoints?: string[];
}

export default function RouteVisualizer() {
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);

  // NER-SHIELD Route Data with coordinates
  const routesData: RouteData[] = [
    {
      id: 'ROUTE-ALTERNATE',
      name: 'ROUTE-ALTERNATE (Safe Route B)',
      type: 'safe',
      distance: 530,
      eta: '12h 00m',
      riskLevel: 'LOW (14%)',
      status: '✅ Clear',
      waypoints: ['Guwahati', 'Nagaon', 'Lumding Bypass', 'Dimapur', 'Kohima', 'Imphal'],
      path: [
        // Guwahati
        { lat: 26.1798, lng: 91.7519 },
        // Nagaon
        { lat: 26.3453, lng: 92.6841 },
        // Lumding Bypass
        { lat: 26.2135, lng: 93.0573 },
        // Dimapur Entry
        { lat: 25.899, lng: 93.7263 },
        // Kohima Checkpoint
        { lat: 25.6742, lng: 94.1085 },
        // Imphal Depot
        { lat: 24.817, lng: 93.9363 },
      ],
    },
    {
      id: 'ROUTE-PRIMARY',
      name: 'ROUTE-PRIMARY (Blocked Route A)',
      type: 'danger',
      distance: 450,
      eta: 'N/A',
      riskLevel: 'CRITICAL (88%)',
      status: '🔴 BLOCKED - Landslide at Km 142',
      waypoints: ['Guwahati', 'Shillong', 'Haflong', 'Silchar', 'Dimapur', 'Kohima', 'Imphal'],
      path: [
        // Guwahati
        { lat: 26.1798, lng: 91.7519 },
        // Shillong
        { lat: 25.5788, lng: 91.8933 },
        // Haflong
        { lat: 25.1767, lng: 92.1467 },
        // Silchar
        { lat: 24.8918, lng: 92.7879 },
        // Dimapur
        { lat: 25.899, lng: 93.7263 },
        // Kohima
        { lat: 25.6742, lng: 94.1085 },
        // Imphal
        { lat: 24.817, lng: 93.9363 },
      ],
    },
  ];

  return (
    <div className="w-full h-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 border-b border-blue-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">🛣️ NER-SHIELD Route Visualizer</h1>
          <p className="text-blue-200 text-sm">Real-time safe vs danger road visualization with Google Maps</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Map Section */}
        <div className="flex-1 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
          <GoogleMapsRouteViewer
            routes={routesData}
            center={{ lat: 25.5, lng: 93 }}
            zoom={7}
          />
        </div>

        {/* Info Panel */}
        <div className="w-96 flex flex-col gap-4 overflow-y-auto">
          {/* Route Cards */}
          {routesData.map((route) => (
            <div
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={`
                rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105
                ${
                  selectedRoute?.id === route.id
                    ? 'ring-2 ring-offset-2 ring-offset-gray-950'
                    : ''
                }
                ${
                  route.type === 'safe'
                    ? 'bg-gradient-to-br from-green-900 to-green-800 ring-green-500 hover:shadow-lg hover:shadow-green-500/20'
                    : 'bg-gradient-to-br from-red-900 to-red-800 ring-red-500 hover:shadow-lg hover:shadow-red-500/20'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider mb-1">
                    {route.type === 'safe' ? '✅ Safe Route' : '🔴 Danger Route'}
                  </div>
                  <h3 className="font-bold text-sm">{route.name}</h3>
                </div>
                {route.type === 'safe' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs opacity-75 mb-1">Distance</div>
                  <div className="font-bold text-sm">{route.distance} km</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs opacity-75 mb-1">ETA</div>
                  <div className="font-bold text-sm">{route.eta}</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs opacity-75 mb-1">Risk Level</div>
                  <div className="font-bold text-sm">{route.riskLevel}</div>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <div className="text-xs opacity-75 mb-1">Status</div>
                  <div className="font-bold text-xs">{route.status}</div>
                </div>
              </div>

              {/* Waypoints */}
              <div className="bg-black/20 rounded p-2 text-xs mb-3">
                <div className="opacity-75 mb-2 font-bold">Route Path:</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {route.waypoints?.map((wp, idx) => (
                    <React.Fragment key={idx}>
                      <span className="bg-black/40 px-2 py-1 rounded">{wp}</span>
                      {idx < (route.waypoints?.length || 0) - 1 && (
                        <ArrowRight className="w-3 h-3 opacity-50" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`
                  w-full py-2 px-3 rounded font-bold text-xs uppercase tracking-wider transition-all
                  ${
                    route.type === 'safe'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white opacity-50 cursor-not-allowed'
                  }
                `}
                disabled={route.type === 'danger'}
              >
                {route.type === 'safe' ? '🗺️ Use This Route' : '⛔ Avoid This Route'}
              </button>
            </div>
          ))}

          {/* Legend */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="font-bold mb-3 text-sm">Color Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-2 bg-green-500 rounded" />
                <span className="text-xs text-gray-400">Safe Route (Recommended)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-2 bg-red-500 rounded" />
                <span className="text-xs text-gray-400">Danger/Blocked Road</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-200">
              💡 <strong>Tip:</strong> Click on routes to view details. Green routes are safe and recommended. Red routes are blocked or dangerous.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
