export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Alert {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  severity: 'low' | 'medium' | 'high';
  source: string;
  verified: boolean;
  photos?: string[]; // Array of base64 encoded photos
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
}

export interface Report {
  _id: string;
  alertId: string;
  userId: string;
  status: 'safe' | 'help';
  note?: string;
  createdAt: string;
}

export interface ReportStats {
  safe: number;
  help: number;
}

export interface AlertWithStats extends Alert {
  reportStats?: ReportStats;
}
