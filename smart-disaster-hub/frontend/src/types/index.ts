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
  photos?: string[]; // Array of base64 encoded photos
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
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

// ─────────────────────────────────────────────────────────────
// Supply Resilience Platform Types
// ─────────────────────────────────────────────────────────────

export type WarehouseType = 'hub' | 'depot' | 'hospital' | 'relief_camp';
export type CargoType = 'medicine' | 'food' | 'fuel' | 'water' | 'general';
export type ShipmentPriority = 'critical' | 'high' | 'normal';
export type ShipmentStatus =
  | 'scheduled'
  | 'in_transit'
  | 'rerouted'
  | 'held'
  | 'delivered'
  | 'at_risk';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';
export type DecisionType = 'CONTINUE' | 'REROUTE' | 'HOLD' | 'ESCALATE';
export type ExplanationSource = 'gemini' | 'template';

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat]
}

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  type: WarehouseType;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoadRisk {
  id: number;
  name: string;
  description?: string;
  status: 'affected' | 'alternate' | 'normal';
  coordinates: [number, number][]; // [lat, lng]
  severity?: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskLevel: RiskLevel;
  riskReason?: string;
  rainfall24h?: number;
  rainfall48h?: number;
  peakHourlyRain?: number;
  minElevation?: number | null;
  riverDischargeRatio?: number | null;
  lastAssessedAt?: string;
}

export interface AgentDecision {
  id: number;
  shipmentId: number;
  roadId?: number | null;
  decision: DecisionType;
  riskScore: number;
  riskLevel: RiskLevel;
  reasoning: string;
  explanationSource: ExplanationSource;
  extraMinutes: number;
  estimatedDelayAvoidedMin: number;
  notified: boolean;
  createdAt: string;
  shipment?: {
    id: number;
    code: string;
    cargoType: CargoType;
    priority: ShipmentPriority;
    status: ShipmentStatus;
    driverName: string;
  };
  road?: {
    id: number;
    name: string;
    status: string;
    riskScore: number;
    riskLevel: RiskLevel;
  };
}

export interface Shipment {
  id: number;
  code: string;
  cargoType: CargoType;
  priority: ShipmentPriority;
  perishable: boolean;
  originWarehouseId: number;
  destinationWarehouseId: number;
  status: ShipmentStatus;
  departureTime?: string;
  etaMinutes: number;
  currentLat: number;
  currentLng: number;
  progress: number;
  originalRoute: GeoJsonLineString;
  activeRoute: GeoJsonLineString;
  originalDurationMin: number;
  activeDurationMin: number;
  driverName: string;
  driverPhone?: string | null;
  telegramChatId?: string | null;
  originWarehouse?: Warehouse;
  destinationWarehouse?: Warehouse;
  decisions?: AgentDecision[];
  isSimulated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImpactMetrics {
  isEstimate: boolean;
  shipmentsProtected: number;
  reroutesCount: number;
  holdsCount: number;
  escalationsCount: number;
  estimatedDelayHoursAvoided: number;
  criticalMedicineProtected: number;
  cargoBreakdown: Record<string, { protected: number; delayAvoidedHours: number }>;
  modelAssumptions: {
    baselineBlockedRoadDelayHours: number;
    delayAvoidedFormula: string;
    disclaimer: string;
  };
}

export interface AgentStatusInfo {
  isRunning: boolean;
  lastRunTime: string | null;
  nextRunTime: string | null;
  intervalMinutes: number;
  runCount: number;
  counts?: {
    totalDecisions: number;
    reroutes: number;
    holds: number;
    escalations: number;
  };
}

export interface ReplayStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  scenario: string | null;
  simulatedTime: string | null;
  currentHourIndex: number;
  totalHours: number;
  speed: number;
  progress: number;
}

export interface ReplayComparison {
  scenario: string;
  isEstimate: boolean;
  withAgent: {
    delayHours: number;
    shipmentsDelayed: number;
    medicineDelayed: number;
    totalProtected: number;
    avgDetourMin: number;
  };
  withoutAgent: {
    delayHours: number;
    shipmentsDelayed: number;
    medicineDelayed: number;
    strandedTrucks: number;
  };
  delayHoursSaved: number;
  reductionPercentage: number;
  label: string;
}
