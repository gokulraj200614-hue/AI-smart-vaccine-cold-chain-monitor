export type RiskClassification = 'SAFE' | 'WARNING' | 'CRITICAL';
export type DeviceConnectivity = 'ONLINE' | 'OFFLINE' | 'SYNCHRONIZING';
export type ActionPriority = 'IMMEDIATE' | 'URGENT' | 'PREVENTIVE' | 'NORMAL';
export type UserRole = 'HEALTHCARE_WORKER' | 'TRANSPORT_PERSONNEL' | 'ADMINISTRATOR';
export type BatchStatus = 'SAFE' | 'EARLY_WARNING' | 'HIGH_RISK' | 'CRITICAL' | 'UNDER_ASSESSMENT' | 'QUARANTINED' | 'STABILIZED';

export interface VaccineBatch {
  id: string;
  vaccineName: string;
  manufacturer: string;
  minTemp: number; // e.g. 2.0 °C
  maxTemp: number; // e.g. 8.0 °C
  idealTemp: number; // e.g. 4.5 °C
  minHumidity: number; // e.g. 30 %
  maxHumidity: number; // e.g. 70 %
  maxAllowedExcursionMinutes: number; // e.g. 120 min
  criticalExcursionMinutes: number; // e.g. 45 min
  criticalUpperTemp: number; // e.g. 15.0 °C
  quantity: number; // number of doses
  unitCost: number; // in USD
  expiryDate: string;
  storageUnitId: string;
  storageUnitName: string;
  deviceId: string;
  currentStatus: BatchStatus;
  isTransport: boolean;
  transportJourneyId?: string;
}

export interface TelemetryReading {
  id: string;
  deviceId: string;
  batchId: string;
  storageUnitId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  isValid: boolean;
  rawStatus: 'NORMAL' | 'OUT_OF_RANGE' | 'SENSOR_FAULT';
  edgeBuffered: boolean;
  gps: {
    lat: number;
    lng: number;
    locationName: string;
    speed?: number;
  };
  batteryLevel: number;
  signalRssi: number;
}

export interface AIRiskPrediction {
  batchId: string;
  riskScore: number; // 0 - 100
  riskClassification: RiskClassification;
  estimatedExposureDurationMinutes: number;
  estimatedTimeUntilSpoilageSeconds: number | null;
  predictedSpoilageTime: string | null;
  temperatureTrend: 'STABLE' | 'RISING_SLOW' | 'RISING_FAST' | 'FALLING_SLOW' | 'FALLING_FAST' | 'RECOVERING';
  rateOfChangeCPerMin: number;
  recoveryTimeRemainingMinutes: number | null;
  repeatedExcursionsCount: number;
  maxRecordedTemp: number;
  minRecordedTemp: number;
  explainabilityFactors: string[];
  earlyWarningMessage: string;
  deepAiAnalysis?: string;
}

export interface PreventiveActionRecommendation {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  actionType: 
    | 'TRANSFER_STORAGE'
    | 'CHECK_SEAL_AND_DOOR'
    | 'ACTIVATE_BACKUP_COOLING'
    | 'ADJUST_THERMOSTAT'
    | 'INSPECT_FREEZING'
    | 'REPLACE_COOLANT_PACKS'
    | 'CONTACT_SUPERVISOR'
    | 'RECORD_EXCURSION_SOP'
    | 'CONTINUE_MONITORING';
  suggestedTargetUnit?: string;
  requiresQuarantine?: boolean;
}

export interface Alert {
  id: string;
  batchId: string;
  batchName: string;
  deviceId: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  currentTemp: number;
  riskScore: number;
  timeToCriticalExposureMinutes?: number;
  recommendedAction: string;
  notificationChannels: {
    dashboard: boolean;
    smsSent: boolean;
    emailSent: boolean;
  };
}

export interface CorrectiveActionLog {
  id: string;
  batchId: string;
  alertId?: string;
  actionType: string;
  notes: string;
  actionTime: string;
  performedBy: string;
  previousRiskScore: number;
  newRiskScore: number;
  previousStatus: BatchStatus;
  newStatus: BatchStatus;
  recheckedTemp: number;
}

export interface TransportJourney {
  id: string;
  batchId: string;
  batchName: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  vehicleType: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  currentLocation: { lat: number; lng: number; locationName: string };
  routeCoordinates: [number, number][];
  currentWaypointIndex: number;
  departureTime: string;
  estimatedArrival: string;
  handoverLocation: string;
  arrivalCondition: 'PENDING' | 'OPTIMAL' | 'EXCURSION_ASSESSED' | 'REJECTED';
  status: 'IN_TRANSIT' | 'ARRIVED' | 'HOLD';
  speedKmH: number;
}

export interface EdgeDevice {
  id: string;
  name: string;
  model: string; // "Sensirion SHT33 High-Precision"
  assignedBatchId: string;
  assignedStorageUnit: string;
  connectivity: DeviceConnectivity;
  bufferCount: number;
  batteryPct: number;
  firmwareVersion: string;
  lastSync: string;
  samplingIntervalSec: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'BATCH' | 'ALERT' | 'DEVICE' | 'CORRECTIVE_ACTION' | 'SIMULATION' | 'REPORT';
  entityId: string;
  details: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
}

export type DemoScenario = 'SAFE' | 'WARNING' | 'CRITICAL' | 'RECOVERY' | 'CUSTOM';
