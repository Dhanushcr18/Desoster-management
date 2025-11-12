import React from 'react';
import { MapPin, Navigation, Clock, User } from 'lucide-react';

interface LocationReport {
  _id: string;
  userId: {
    name: string;
  };
  locationDetails: {
    address?: string;
    landmark?: string;
    affectedRoad?: string;
    alternateRoute?: string;
    extraDistance?: number;
    estimatedTime?: number;
    routeDescription?: string;
  };
  createdAt: string;
}

interface LocationReportsProps {
  reports: LocationReport[];
}

export default function LocationReports({ reports }: LocationReportsProps) {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">No location reports yet</p>
        <p className="text-sm text-gray-500 mt-1">Be the first to share route information!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report._id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
          {/* User Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-900">
                {report.userId?.name || 'Anonymous'}
              </span>
            </div>
            <span className="text-xs text-green-600">
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Location Details */}
          <div className="space-y-2">
            {report.locationDetails.address && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-green-700">Location:</span>
                  <p className="text-sm text-green-900">{report.locationDetails.address}</p>
                  {report.locationDetails.landmark && (
                    <p className="text-xs text-green-700">Near: {report.locationDetails.landmark}</p>
                  )}
                </div>
              </div>
            )}

            {report.locationDetails.affectedRoad && (
              <div className="bg-red-100 border border-red-300 rounded px-3 py-2">
                <p className="text-xs font-semibold text-red-800 mb-1">🚧 Affected Road:</p>
                <p className="text-sm text-red-900">{report.locationDetails.affectedRoad}</p>
              </div>
            )}

            {report.locationDetails.alternateRoute && (
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">✅ Alternate Route:</p>
                  </div>
                  {(report.locationDetails.extraDistance || report.locationDetails.estimatedTime) && (
                    <div className="flex items-center space-x-2 text-xs text-blue-700">
                      {report.locationDetails.extraDistance && (
                        <span className="bg-blue-200 px-2 py-0.5 rounded font-medium">
                          +{report.locationDetails.extraDistance} km
                        </span>
                      )}
                      {report.locationDetails.estimatedTime && (
                        <span className="bg-blue-200 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{report.locationDetails.estimatedTime} min</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-blue-900">{report.locationDetails.alternateRoute}</p>
              </div>
            )}

            {report.locationDetails.routeDescription && (
              <div className="bg-white border border-green-300 rounded px-3 py-2">
                <p className="text-xs font-semibold text-green-800 mb-1">📍 Detailed Directions:</p>
                <p className="text-sm text-gray-800 leading-relaxed">{report.locationDetails.routeDescription}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
