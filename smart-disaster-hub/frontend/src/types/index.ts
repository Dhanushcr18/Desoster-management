export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Alert {
  _id: string;
  title: string;
  description: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  severity: 'low' | 'medium' | 'high';
  source: string;
  verified: boolean;
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
