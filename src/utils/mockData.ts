import { 
  VaccineBatch, 
  EdgeDevice, 
  TransportJourney, 
  Alert, 
  UserProfile, 
  TelemetryReading,
  CorrectiveActionLog,
  AuditLogEntry
} from '../types';

export const INITIAL_BATCHES: VaccineBatch[] = [
  {
    id: 'BATCH-2026-COV-01',
    vaccineName: 'Spikevax bivalent (mRNA-1273)',
    manufacturer: 'Moderna Therapeutics',
    minTemp: 2.0,
    maxTemp: 8.0,
    idealTemp: 4.5,
    minHumidity: 30,
    maxHumidity: 65,
    maxAllowedExcursionMinutes: 120,
    criticalExcursionMinutes: 45,
    criticalUpperTemp: 14.0,
    quantity: 4800,
    unitCost: 32.5,
    expiryDate: '2027-04-15',
    storageUnitId: 'COLD-ROOM-ALPHA',
    storageUnitName: 'Central Vaccine Cold Vault #1',
    deviceId: 'SHT33-EDGE-01',
    currentStatus: 'SAFE',
    isTransport: false,
  },
  {
    id: 'BATCH-2026-MMR-88',
    vaccineName: 'M-M-R II (Live Attenuated)',
    manufacturer: 'Merck & Co.',
    minTemp: 2.0,
    maxTemp: 8.0,
    idealTemp: 5.0,
    minHumidity: 25,
    maxHumidity: 60,
    maxAllowedExcursionMinutes: 90,
    criticalExcursionMinutes: 30,
    criticalUpperTemp: 12.0,
    quantity: 1250,
    unitCost: 45.0,
    expiryDate: '2026-11-30',
    storageUnitId: 'REEFER-TRUCK-T12',
    storageUnitName: 'Reefer Transport Carrier T-12',
    deviceId: 'SHT33-EDGE-02',
    currentStatus: 'SAFE',
    isTransport: true,
    transportJourneyId: 'TR-JOURNEY-904',
  },
  {
    id: 'BATCH-2026-POL-34',
    vaccineName: 'IPOL (Inactivated Poliomyelitis)',
    manufacturer: 'Sanofi Pasteur',
    minTemp: 2.0,
    maxTemp: 8.0,
    idealTemp: 4.0,
    minHumidity: 35,
    maxHumidity: 70,
    maxAllowedExcursionMinutes: 180,
    criticalExcursionMinutes: 60,
    criticalUpperTemp: 15.0,
    quantity: 3200,
    unitCost: 28.0,
    expiryDate: '2027-08-20',
    storageUnitId: 'STORAGE-DEPOT-WEST',
    storageUnitName: 'West District Mobile Distribution Hub',
    deviceId: 'SHT33-EDGE-03',
    currentStatus: 'SAFE',
    isTransport: false,
  },
  {
    id: 'BATCH-2026-HPV-19',
    vaccineName: 'Gardasil 9 (Recombinant 9-valent)',
    manufacturer: 'Merck Sharp & Dohme',
    minTemp: 2.0,
    maxTemp: 8.0,
    idealTemp: 4.8,
    minHumidity: 30,
    maxHumidity: 65,
    maxAllowedExcursionMinutes: 72,
    criticalExcursionMinutes: 35,
    criticalUpperTemp: 13.0,
    quantity: 950,
    unitCost: 180.0,
    expiryDate: '2027-01-10',
    storageUnitId: 'CLINIC-FRIDGE-04',
    storageUnitName: 'Community Clinic Pharmacy Chiller 4',
    deviceId: 'SHT33-EDGE-04',
    currentStatus: 'SAFE',
    isTransport: false,
  }
];

export const INITIAL_DEVICES: EdgeDevice[] = [
  {
    id: 'SHT33-EDGE-01',
    name: 'SHT33 Edge Node Alpha (Cold Vault 1)',
    model: 'Sensirion SHT33 High-Precision (±0.15°C, ±1.5% RH)',
    assignedBatchId: 'BATCH-2026-COV-01',
    assignedStorageUnit: 'Central Vaccine Cold Vault #1',
    connectivity: 'ONLINE',
    bufferCount: 0,
    batteryPct: 98,
    firmwareVersion: 'v2.4.1-echelon',
    lastSync: new Date().toISOString(),
    samplingIntervalSec: 5,
  },
  {
    id: 'SHT33-EDGE-02',
    name: 'SHT33 Edge Node Mobile (Reefer T-12)',
    model: 'Sensirion SHT33 + Quectel BG95 Cellular Gateway',
    assignedBatchId: 'BATCH-2026-MMR-88',
    assignedStorageUnit: 'Reefer Transport Carrier T-12',
    connectivity: 'ONLINE',
    bufferCount: 0,
    batteryPct: 87,
    firmwareVersion: 'v2.4.1-echelon',
    lastSync: new Date().toISOString(),
    samplingIntervalSec: 5,
  },
  {
    id: 'SHT33-EDGE-03',
    name: 'SHT33 Edge Node West (Depot Hub)',
    model: 'Sensirion SHT33 High-Precision',
    assignedBatchId: 'BATCH-2026-POL-34',
    assignedStorageUnit: 'West District Mobile Distribution Hub',
    connectivity: 'ONLINE',
    bufferCount: 0,
    batteryPct: 94,
    firmwareVersion: 'v2.4.0-echelon',
    lastSync: new Date().toISOString(),
    samplingIntervalSec: 5,
  },
  {
    id: 'SHT33-EDGE-04',
    name: 'SHT33 Edge Node Clinic #4',
    model: 'Sensirion SHT33 High-Precision',
    assignedBatchId: 'BATCH-2026-HPV-19',
    assignedStorageUnit: 'Community Clinic Pharmacy Chiller 4',
    connectivity: 'ONLINE',
    bufferCount: 0,
    batteryPct: 91,
    firmwareVersion: 'v2.4.1-echelon',
    lastSync: new Date().toISOString(),
    samplingIntervalSec: 5,
  }
];

export const INITIAL_TRANSPORTS: TransportJourney[] = [
  {
    id: 'TR-JOURNEY-904',
    batchId: 'BATCH-2026-MMR-88',
    batchName: 'M-M-R II (1,250 doses)',
    driverName: 'Marcus Vance (Certified Cold-Chain Courier)',
    driverPhone: '+1 (555) 438-9921',
    vehicleId: 'REEFER-TRUCK-T12',
    vehicleType: 'Carrier Transicold Supra 850 Climate Truck',
    origin: { name: 'State Bio-Repository Central', lat: 37.7749, lng: -122.4194 },
    destination: { name: 'St. Jude Regional Healthcare Center', lat: 37.3382, lng: -121.8863 },
    currentLocation: { lat: 37.5485, lng: -122.2711, locationName: 'Highway 101 Southbound (San Mateo Corridor)' },
    routeCoordinates: [
      [37.7749, -122.4194],
      [37.7021, -122.4712],
      [37.6213, -122.3790],
      [37.5485, -122.2711],
      [37.4419, -122.1430],
      [37.3688, -122.0363],
      [37.3382, -121.8863]
    ],
    currentWaypointIndex: 3,
    departureTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    handoverLocation: 'Bay 3 Biomedical Receiving Dock',
    arrivalCondition: 'PENDING',
    status: 'IN_TRANSIT',
    speedKmH: 88,
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'USR-01',
    name: 'Dr. Elena Rostova, PharmD',
    email: 'elena.rostova@healthchain.gov',
    role: 'HEALTHCARE_WORKER',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    department: 'Vaccine Inventory & Cold Chain Stewardship'
  },
  {
    id: 'USR-02',
    name: 'Marcus Vance',
    email: 'marcus.vance@cryologistics.com',
    role: 'TRANSPORT_PERSONNEL',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    department: 'Active Fleet Logistics'
  },
  {
    id: 'USR-03',
    name: 'Director Arthur Sterling',
    email: 'sterling.a@who-surveillance.int',
    role: 'ADMINISTRATOR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    department: 'Director of Bio-Security & Quality Assurance'
  }
];

export function generateInitialTelemetryHistory(batch: VaccineBatch, count = 25): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const now = Date.now();
  const stepMs = 5000; // 5s interval

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();
    // Normal nominal jitter around idealTemp
    const jitter = (Math.sin(i * 0.4) * 0.3) + (Math.random() * 0.2 - 0.1);
    const temperature = Number((batch.idealTemp + jitter).toFixed(2));
    const humidity = Number((50 + Math.cos(i * 0.3) * 5 + (Math.random() * 2 - 1)).toFixed(1));

    readings.push({
      id: `TEL-${batch.id}-${now - i * stepMs}`,
      deviceId: batch.deviceId,
      batchId: batch.id,
      storageUnitId: batch.storageUnitId,
      timestamp,
      temperature,
      humidity,
      isValid: true,
      rawStatus: 'NORMAL',
      edgeBuffered: false,
      gps: batch.isTransport 
        ? { lat: 37.5485, lng: -122.2711, locationName: 'Highway 101 Southbound', speed: 85 }
        : { lat: 37.7749, lng: -122.4194, locationName: 'Central Depot Vault' },
      batteryLevel: 98,
      signalRssi: -65,
    });
  }

  return readings;
}

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    userName: 'Director Arthur Sterling',
    userRole: 'ADMINISTRATOR',
    action: 'SYSTEM_INITIALIZATION',
    entityType: 'DEVICE',
    entityId: 'SHT33-EDGE-01',
    details: 'ECHELON Cold-Chain Engine calibrated with Sensirion SHT33 sensor array. Base safe boundaries (2.0°C - 8.0°C) locked.'
  },
  {
    id: 'AUD-002',
    timestamp: new Date(Date.now() - 2400 * 1000).toISOString(),
    userName: 'Dr. Elena Rostova, PharmD',
    userRole: 'HEALTHCARE_WORKER',
    action: 'BATCH_RECEIPT_VERIFICATION',
    entityType: 'BATCH',
    entityId: 'BATCH-2026-COV-01',
    details: 'Ingested 4,800 doses of Spikevax bivalent into Central Vaccine Cold Vault #1. Initial temperature verified at 4.2°C.'
  },
  {
    id: 'AUD-003',
    timestamp: new Date(Date.now() - 1800 * 1000).toISOString(),
    userName: 'Marcus Vance',
    userRole: 'TRANSPORT_PERSONNEL',
    action: 'TRANSPORT_DISPATCH',
    entityType: 'BATCH',
    entityId: 'BATCH-2026-MMR-88',
    details: 'Loaded 1,250 doses of M-M-R II onto Reefer Transport Carrier T-12. Active pre-cooling verified at 4.8°C.'
  }
];
