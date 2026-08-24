import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  ColdChainDevice, 
  SensorReading, 
  VaccineBatch, 
  VaccineProfile, 
  AlertNotification, 
  CorrectiveActionLog, 
  TransportShipment,
  AiRiskAnalysisResult 
} from "./src/types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client (Safe lazy init with proper User-Agent header)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// -------------------------------------------------------------
// SEED DATA & IN-MEMORY STATE STORE
// -------------------------------------------------------------

export const VACCINE_PROFILES: VaccineProfile[] = [
  {
    id: "VAC-PFIZER-COM",
    name: "Pfizer-BioNTech Comirnaty (mRNA)",
    category: "mRNA",
    targetMinTemp: -80,
    targetMaxTemp: -60,
    targetMinHumidity: 20,
    targetMaxHumidity: 65,
    criticalHighTemp: -50,
    criticalLowTemp: -90,
    maxExcursionMinutes: 120,
    sensitivity: "Ultra-Cold mRNA",
    manufacturer: "BioNTech / Pfizer",
    recommendedStorage: "Ultra-Low Temperature Freezer (-80°C to -60°C)"
  },
  {
    id: "VAC-MODERNA-SPIKE",
    name: "Moderna Spikevax (mRNA)",
    category: "mRNA",
    targetMinTemp: -25,
    targetMaxTemp: -15,
    targetMinHumidity: 25,
    targetMaxHumidity: 70,
    criticalHighTemp: -10,
    criticalLowTemp: -40,
    maxExcursionMinutes: 180,
    sensitivity: "Ultra-Cold mRNA",
    manufacturer: "ModernaTX Inc.",
    recommendedStorage: "Deep Frozen Storage (-25°C to -15°C)"
  },
  {
    id: "VAC-MEASLES-RUB",
    name: "Measles-Rubella Vaccine Live (Freeze-Dried)",
    category: "Live Attenuated",
    targetMinTemp: 2,
    targetMaxTemp: 8,
    targetMinHumidity: 30,
    targetMaxHumidity: 60,
    criticalHighTemp: 10,
    criticalLowTemp: 0,
    maxExcursionMinutes: 240,
    sensitivity: "Heat Sensitive",
    manufacturer: "Serum Institute of India",
    recommendedStorage: "WHO PQS Certified Refrigerated Cold Room (+2°C to +8°C)"
  },
  {
    id: "VAC-POLIO-BOPV",
    name: "Bivalent Oral Poliomyelitis Vaccine (bOPV)",
    category: "Live Attenuated",
    targetMinTemp: -20,
    targetMaxTemp: 4,
    targetMinHumidity: 20,
    targetMaxHumidity: 60,
    criticalHighTemp: 8,
    criticalLowTemp: -25,
    maxExcursionMinutes: 300,
    sensitivity: "Heat Sensitive",
    manufacturer: "Sanofi Pasteur",
    recommendedStorage: "Freezer for long-term or +2°C to +8°C for field use"
  },
  {
    id: "VAC-HEPB-RECOMB",
    name: "Recombinant Hepatitis B (Recombivax)",
    category: "Subunit",
    targetMinTemp: 2,
    targetMaxTemp: 8,
    targetMinHumidity: 35,
    targetMaxHumidity: 75,
    criticalHighTemp: 12,
    criticalLowTemp: 0, // DANGER: Freezing irreversibly denatures aluminum adjuvant!
    maxExcursionMinutes: 90,
    sensitivity: "Freeze Sensitive",
    manufacturer: "Merck Sharp & Dohme",
    recommendedStorage: "Refrigerated (+2°C to +8°C) — NEVER FREEZE"
  },
  {
    id: "VAC-ROTAVIRUS-ROT",
    name: "Rotavirus Oral Suspension (Rotarix)",
    category: "Live Attenuated",
    targetMinTemp: 2,
    targetMaxTemp: 8,
    targetMinHumidity: 30,
    targetMaxHumidity: 65,
    criticalHighTemp: 12,
    criticalLowTemp: 0,
    maxExcursionMinutes: 180,
    sensitivity: "Heat Sensitive",
    manufacturer: "GSK Biologicals",
    recommendedStorage: "Standard Cold Chain (+2°C to +8°C)"
  }
];

let devices: ColdChainDevice[] = [
  {
    id: "DEV-ULT-801",
    name: "Ultra-Low Cryo-Freezer #1",
    code: "ULT-801",
    type: "ULTRA_LOW_FREEZER",
    locationName: "Central Biomedical Depot — Cold Vault 3",
    facilityType: "Central Vaccine Depot",
    status: "active",
    targetTempMin: -80,
    targetTempMax: -60,
    currentTemp: -72.4,
    currentHumidity: 38.2,
    rateOfChange: 0.12,
    lastSyncTimestamp: new Date().toISOString(),
    bufferQueueCount: 0,
    isOnline: true,
    powerSource: "Mains Grid",
    compressorState: "running",
    doorState: "closed",
    activeBatchIds: ["BATCH-PFZ-2026-09A", "BATCH-PFZ-2026-09B"]
  },
  {
    id: "DEV-REF-402",
    name: "Pharma Grade Cold Refrigerator #4",
    code: "REF-402",
    type: "STANDARD_PHARMA_FRIDGE",
    locationName: "Regional Hospital — Pharmacy Storage Room B",
    facilityType: "Regional Hub",
    status: "active",
    targetTempMin: 2,
    targetTempMax: 8,
    currentTemp: 4.6,
    currentHumidity: 45.1,
    rateOfChange: -0.05,
    lastSyncTimestamp: new Date().toISOString(),
    bufferQueueCount: 0,
    isOnline: true,
    powerSource: "Mains Grid",
    compressorState: "running",
    doorState: "closed",
    activeBatchIds: ["BATCH-MR-8831", "BATCH-HEP-4402"]
  },
  {
    id: "DEV-TRK-09X",
    name: "Reefer Transport Van (Fleet Unit 09)",
    code: "TRK-09X",
    type: "REEFER_TRANSIT_VAN",
    locationName: "Interstate Route 44 (Mile Marker 128)",
    facilityType: "Transit Fleet",
    status: "active",
    targetTempMin: 2,
    targetTempMax: 8,
    currentTemp: 5.8,
    currentHumidity: 52.0,
    rateOfChange: 0.35,
    lastSyncTimestamp: new Date().toISOString(),
    bufferQueueCount: 0,
    isOnline: true,
    powerSource: "Vehicle Alternator",
    compressorState: "running",
    doorState: "closed",
    activeBatchIds: ["BATCH-ROTA-7714", "BATCH-POLIO-1903"],
    gps: {
      lat: 37.7749,
      lng: -122.4194,
      speedKmH: 74,
      heading: 142,
      routeOrigin: "National Vaccine Depot (Hub 1)",
      routeDestination: "St. Jude Community Health Center",
      estimatedArrival: new Date(Date.now() + 54 * 60000).toISOString()
    }
  },
  {
    id: "DEV-SDD-105",
    name: "Solar Direct Drive Cooler Unit",
    code: "SDD-105",
    type: "SOLAR_DIRECT_DRIVE_COOLER",
    locationName: "Highland Rural Health Post",
    facilityType: "Remote Health Post",
    status: "active",
    targetTempMin: 2,
    targetTempMax: 8,
    currentTemp: 3.9,
    currentHumidity: 49.3,
    rateOfChange: -0.10,
    lastSyncTimestamp: new Date().toISOString(),
    bufferQueueCount: 0,
    isOnline: true,
    powerSource: "Solar Battery",
    compressorState: "running",
    doorState: "closed",
    activeBatchIds: ["BATCH-HEP-4409"]
  },
  {
    id: "DEV-VIP-033",
    name: "Vaccine VIP Active Cold Box",
    code: "VIP-033",
    type: "PASSIVE_VIP_SHIPPER",
    locationName: "Mobile Field Vaccination Camp A",
    facilityType: "Urban Clinic",
    status: "active",
    targetTempMin: -25,
    targetTempMax: -15,
    currentTemp: -19.5,
    currentHumidity: 42.0,
    rateOfChange: 0.08,
    lastSyncTimestamp: new Date().toISOString(),
    bufferQueueCount: 0,
    isOnline: true,
    powerSource: "Passive Thermal Pack",
    compressorState: "idle",
    doorState: "closed",
    activeBatchIds: ["BATCH-MOD-5521"]
  }
];

let batches: VaccineBatch[] = [
  {
    id: "BATCH-PFZ-2026-09A",
    batchNumber: "PF-2026-09A",
    vaccineId: "VAC-PFIZER-COM",
    vaccineName: "Pfizer-BioNTech Comirnaty (mRNA)",
    quantityDoses: 3600,
    expiryDate: "2027-03-31",
    manufactureDate: "2026-06-15",
    assignedDeviceId: "DEV-ULT-801",
    status: "safe",
    currentTemp: -72.4,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: -72.1,
    stabilityIndex: 100,
    lastInspectedBy: "Dr. Elena Rostova (Lead Pharmacist)",
    lastInspectedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: "Primary lot for Q3 national immunisation rollout."
  },
  {
    id: "BATCH-PFZ-2026-09B",
    batchNumber: "PF-2026-09B",
    vaccineId: "VAC-PFIZER-COM",
    vaccineName: "Pfizer-BioNTech Comirnaty (mRNA)",
    quantityDoses: 2400,
    expiryDate: "2027-03-31",
    manufactureDate: "2026-06-18",
    assignedDeviceId: "DEV-ULT-801",
    status: "safe",
    currentTemp: -72.4,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: -71.8,
    stabilityIndex: 99.4,
    lastInspectedBy: "Dr. Elena Rostova",
    lastInspectedAt: new Date(Date.now() - 7200000).toISOString(),
    notes: "Backup reserve inventory."
  },
  {
    id: "BATCH-MR-8831",
    batchNumber: "MR-8831-S",
    vaccineId: "VAC-MEASLES-RUB",
    vaccineName: "Measles-Rubella Vaccine Live",
    quantityDoses: 5000,
    expiryDate: "2027-11-30",
    manufactureDate: "2026-05-10",
    assignedDeviceId: "DEV-REF-402",
    status: "safe",
    currentTemp: 4.6,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: 4.5,
    stabilityIndex: 98.8,
    lastInspectedBy: "Nurse Sarah Jenkins",
    lastInspectedAt: new Date(Date.now() - 5400000).toISOString(),
    notes: "Stored at optimal midpoint (+4.5°C)."
  },
  {
    id: "BATCH-HEP-4402",
    batchNumber: "HB-4402-A",
    vaccineId: "VAC-HEPB-RECOMB",
    vaccineName: "Recombinant Hepatitis B (Recombivax)",
    quantityDoses: 1800,
    expiryDate: "2027-08-15",
    manufactureDate: "2026-04-20",
    assignedDeviceId: "DEV-REF-402",
    status: "safe",
    currentTemp: 4.6,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: 4.6,
    stabilityIndex: 100,
    lastInspectedBy: "Nurse Sarah Jenkins",
    lastInspectedAt: new Date(Date.now() - 9000000).toISOString(),
    notes: "Adjuvant integrity critical: zero freeze tolerance."
  },
  {
    id: "BATCH-ROTA-7714",
    batchNumber: "ROT-7714",
    vaccineId: "VAC-ROTAVIRUS-ROT",
    vaccineName: "Rotavirus Oral Suspension (Rotarix)",
    quantityDoses: 1200,
    expiryDate: "2027-06-30",
    manufactureDate: "2026-07-01",
    assignedDeviceId: "DEV-TRK-09X",
    status: "safe",
    currentTemp: 5.8,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: 5.2,
    stabilityIndex: 97.5,
    lastInspectedBy: "Driver Marcus Vance",
    lastInspectedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: "In transit to St. Jude Community Clinic."
  },
  {
    id: "BATCH-POLIO-1903",
    batchNumber: "OPV-1903",
    vaccineId: "VAC-POLIO-BOPV",
    vaccineName: "Bivalent Oral Poliomyelitis Vaccine (bOPV)",
    quantityDoses: 4200,
    expiryDate: "2027-04-15",
    manufactureDate: "2026-05-12",
    assignedDeviceId: "DEV-TRK-09X",
    status: "safe",
    currentTemp: 5.8,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: 4.8,
    stabilityIndex: 96.2,
    lastInspectedBy: "Driver Marcus Vance",
    lastInspectedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: "WHO PQS monitored payload."
  },
  {
    id: "BATCH-HEP-4409",
    batchNumber: "HB-4409-R",
    vaccineId: "VAC-HEPB-RECOMB",
    vaccineName: "Recombinant Hepatitis B (Recombivax)",
    quantityDoses: 850,
    expiryDate: "2027-09-10",
    manufactureDate: "2026-06-02",
    assignedDeviceId: "DEV-SDD-105",
    status: "safe",
    currentTemp: 3.9,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: 4.1,
    stabilityIndex: 99.1,
    lastInspectedBy: "Community Officer Tariq M.",
    lastInspectedAt: new Date(Date.now() - 12000000).toISOString(),
    notes: "Solar direct drive installation with ice bank buffer."
  },
  {
    id: "BATCH-MOD-5521",
    batchNumber: "MOD-5521-X",
    vaccineId: "VAC-MODERNA-SPIKE",
    vaccineName: "Moderna Spikevax (mRNA)",
    quantityDoses: 1500,
    expiryDate: "2027-02-28",
    manufactureDate: "2026-06-11",
    assignedDeviceId: "DEV-VIP-033",
    status: "safe",
    currentTemp: -19.5,
    cumulativeExcursionMinutes: 0,
    meanKineticTemperature: -19.8,
    stabilityIndex: 99.5,
    lastInspectedBy: "Medic Chloe Adams",
    lastInspectedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: "Field vaccination deployment."
  }
];

// In-Memory Time-Series Storage (deviceId -> SensorReading[])
const telemetryStorage = new Map<string, SensorReading[]>();

// Offline Edge buffers (deviceId -> SensorReading[])
const edgeOfflineBuffers = new Map<string, SensorReading[]>();

// Initialize 30 historical time-series points per device
function seedHistoricalTelemetry() {
  const now = Date.now();
  devices.forEach(dev => {
    const readings: SensorReading[] = [];
    const baseTemp = dev.type === "ULTRA_LOW_FREEZER" ? -72.5 
      : dev.type === "PASSIVE_VIP_SHIPPER" ? -19.5 
      : 4.5;
    
    for (let i = 29; i >= 0; i--) {
      const ts = new Date(now - i * 60000).toISOString();
      const tempNoise = (Math.sin(i / 3) * 0.4) + ((Math.random() - 0.5) * 0.2);
      const temp = Number((baseTemp + tempNoise).toFixed(2));
      const hum = Number((45 + (Math.cos(i / 4) * 4) + (Math.random() * 2)).toFixed(1));
      const rate = Number(((Math.random() - 0.5) * 0.15).toFixed(2));

      readings.push({
        id: `TEL-${dev.id}-${now - i * 60000}`,
        deviceId: dev.id,
        timestamp: ts,
        temperature: temp,
        humidity: hum,
        ambientTemp: 22.5 + Math.sin(i / 10) * 2,
        batteryLevel: 98 - Math.floor(i / 10),
        signalStrength: -65 - Math.floor(Math.random() * 8),
        crcValid: true,
        bufferedAtEdge: false,
        rateOfChange: rate,
        riskScore: Math.floor(Math.random() * 12) + 5,
        riskLevel: "safe"
      });
    }
    telemetryStorage.set(dev.id, readings);
    edgeOfflineBuffers.set(dev.id, []);
  });
}

seedHistoricalTelemetry();

let alerts: AlertNotification[] = [
  {
    id: "ALT-INIT-01",
    deviceId: "DEV-TRK-09X",
    deviceName: "Reefer Transport Van (Fleet Unit 09)",
    batchIds: ["BATCH-ROTA-7714", "BATCH-POLIO-1903"],
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    severity: "warning",
    title: "Thermal Inertia Warning: Rapid Temperature Rise (+0.35°C/hr)",
    message: "Reefer compartment temperature rose from +4.8°C to +5.8°C during Highway transit. Compressor cycle inspected.",
    currentValue: 5.8,
    thresholdValue: 7.0,
    parameter: "rate_of_change",
    channelsDispatched: {
      email: true,
      sms: true,
      push: true,
      siren: false
    },
    status: "acknowledged",
    acknowledgedBy: "Driver Marcus Vance (via Mobile App)",
    acknowledgedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    notes: "Driver adjusted auxiliary reefer vents. Rate of change stabilized."
  }
];

let actionLogs: CorrectiveActionLog[] = [
  {
    id: "ACT-001",
    alertId: "ALT-INIT-01",
    deviceId: "DEV-TRK-09X",
    batchIds: ["BATCH-ROTA-7714", "BATCH-POLIO-1903"],
    actionType: "Adjusted Thermostat Setpoint",
    performedBy: "Marcus Vance",
    userRole: "transport_personnel",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    preActionTemp: 5.8,
    postActionTemp: 5.2,
    safetyStatusAssigned: "Safe to Administer",
    signature: "M. Vance [ID-4902]",
    comments: "Lowered cab thermostat to +3.5°C; seals checked and verified airtight."
  }
];

let shipments: TransportShipment[] = [
  {
    id: "SHIP-2026-8801",
    trackingNumber: "ECH-TRK-8801-US",
    deviceId: "DEV-TRK-09X",
    carrier: "ColdChain Express Logistics",
    driverName: "Marcus Vance",
    driverPhone: "+1 (555) 234-8899",
    origin: "National Vaccine Depot (Hub 1), South San Francisco",
    destination: "St. Jude Community Health Center, San Jose",
    departureTime: new Date(Date.now() - 90 * 60000).toISOString(),
    eta: new Date(Date.now() + 50 * 60000).toISOString(),
    status: "In Transit",
    coldChainIntegrityScore: 98.4,
    activeBatchCount: 2,
    totalDoses: 5400,
    currentLocation: {
      lat: 37.5585,
      lng: -122.2711,
      address: "US-101 Southbound, San Mateo Corridor"
    },
    waypoints: [
      {
        name: "National Vaccine Depot (Origin Departure)",
        lat: 37.6547,
        lng: -122.4077,
        reached: true,
        timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        tempAtArrival: 4.2
      },
      {
        name: "Burlingame Transit Checkpoint #1",
        lat: 37.5841,
        lng: -122.3661,
        reached: true,
        timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
        tempAtArrival: 4.9
      },
      {
        name: "San Mateo Telematics Gateway #2",
        lat: 37.5585,
        lng: -122.2711,
        reached: true,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        tempAtArrival: 5.8
      },
      {
        name: "Palo Alto Waypoint Hub",
        lat: 37.4419,
        lng: -122.1430,
        reached: false
      },
      {
        name: "St. Jude Community Health Center (Final Arrival)",
        lat: 37.3382,
        lng: -121.8863,
        reached: false
      }
    ],
    handoverChecklist: {
      vvmStagePassed: true,
      physicalSealIntact: true,
      dataLoggerDownloaded: true
    }
  }
];

// -------------------------------------------------------------
// SIMULATION ENGINE: Realistic physics & SHT33 sensor stream
// -------------------------------------------------------------

function calculateRisk(dev: ColdChainDevice, temp: number, roc: number): { score: number; level: "safe" | "warning" | "critical"; anomaly?: string } {
  const min = dev.targetTempMin;
  const max = dev.targetTempMax;

  let score = 5;
  let anomaly: string | undefined;

  // Temperature distance from safe bounds
  if (temp > max) {
    const diff = temp - max;
    if (diff > 4.0) {
      score += 70 + Math.min(25, diff * 5);
      anomaly = `Severe High Temperature Excursion (${temp.toFixed(1)}°C vs max ${max}°C)`;
    } else if (diff > 1.5) {
      score += 45 + diff * 8;
      anomaly = `Moderate High Temperature Warning (${temp.toFixed(1)}°C vs max ${max}°C)`;
    } else {
      score += 25 + diff * 10;
      anomaly = `Marginal Temperature Rise above target (${temp.toFixed(1)}°C)`;
    }
  } else if (temp < min) {
    const diff = min - temp;
    if (diff > 3.0) {
      score += 75 + Math.min(20, diff * 5);
      anomaly = `Critical Sub-Zero Freeze Breach (${temp.toFixed(1)}°C vs min ${min}°C)`;
    } else {
      score += 35 + diff * 10;
      anomaly = `Sub-target Temperature Dip (${temp.toFixed(1)}°C)`;
    }
  }

  // Rate of change impact
  const absRoc = Math.abs(roc);
  if (absRoc > 2.0) {
    score += 30;
    anomaly = anomaly ? `${anomaly} + Rapid Thermal Shift (${roc > 0 ? '+' : ''}${roc.toFixed(2)}°C/hr)` : `Rapid Thermal Instability (${roc > 0 ? '+' : ''}${roc.toFixed(2)}°C/hr)`;
  } else if (absRoc > 0.8) {
    score += 15;
  }

  // Door ajar or power fault impact
  if (dev.doorState === "ajar_warning" || dev.doorState === "open") {
    score += 25;
    anomaly = anomaly ? `${anomaly} (Door Open)` : "Enclosure Door Ajar / Seal Compromise";
  }
  if (dev.compressorState === "fault") {
    score += 35;
    anomaly = anomaly ? `${anomaly} (Compressor Offline)` : "Cooling Compressor Mechanical Fault";
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let level: "safe" | "warning" | "critical" = "safe";
  if (score >= 71) level = "critical";
  else if (score >= 31) level = "warning";

  return { score, level, anomaly };
}

// Background simulation ticker (every 3.5 seconds)
setInterval(() => {
  const now = new Date();
  const nowIso = now.toISOString();

  devices.forEach(dev => {
    const history = telemetryStorage.get(dev.id) || [];
    const lastReading = history[history.length - 1];

    let currentT = dev.currentTemp;
    let targetMid = (dev.targetTempMin + dev.targetTempMax) / 2;

    // Thermal physics simulation
    let drift = 0;
    if (dev.doorState === "open" || dev.doorState === "ajar_warning") {
      drift += (22 - currentT) * 0.04; // Room air infiltration
    }
    if (dev.compressorState === "fault") {
      drift += (24 - currentT) * 0.03; // Insulation thermal decay
    } else if (dev.compressorState === "running") {
      // Normal compressor regulation towards midpoint with subtle oscillation
      drift += (targetMid - currentT) * 0.05 + ((Math.random() - 0.5) * 0.08);
    }

    const newTemp = Number((currentT + drift).toFixed(2));
    const roc = Number(((newTemp - (lastReading?.temperature || currentT)) * 60).toFixed(2)); // °C per hour
    const newHum = Number(Math.max(15, Math.min(95, dev.currentHumidity + (Math.random() - 0.5) * 0.8)).toFixed(1));

    const risk = calculateRisk(dev, newTemp, roc);

    dev.currentTemp = newTemp;
    dev.currentHumidity = newHum;
    dev.rateOfChange = roc;
    dev.lastSyncTimestamp = nowIso;

    // If device has GPS (transport), simulate moving along route
    if (dev.gps) {
      dev.gps.lat += 0.0003;
      dev.gps.lng += 0.0004;
      dev.gps.speedKmH = Math.max(0, Math.min(100, 68 + Math.floor(Math.sin(Date.now() / 10000) * 15)));
    }

    const newReading: SensorReading = {
      id: `TEL-${dev.id}-${Date.now()}`,
      deviceId: dev.id,
      timestamp: nowIso,
      temperature: newTemp,
      humidity: newHum,
      ambientTemp: 23.2,
      batteryLevel: Math.max(10, (lastReading?.batteryLevel || 95) - 0.01),
      signalStrength: -68 + Math.floor((Math.random() - 0.5) * 6),
      crcValid: true,
      bufferedAtEdge: !dev.isOnline,
      rateOfChange: roc,
      riskScore: risk.score,
      riskLevel: risk.level,
      anomalyDetected: risk.anomaly
    };

    if (dev.isOnline) {
      history.push(newReading);
      if (history.length > 100) history.shift();
      telemetryStorage.set(dev.id, history);
      dev.bufferQueueCount = 0;
    } else {
      // Offline buffering on Edge device flash memory
      const offlineBuffer = edgeOfflineBuffers.get(dev.id) || [];
      offlineBuffer.push(newReading);
      edgeOfflineBuffers.set(dev.id, offlineBuffer);
      dev.bufferQueueCount = offlineBuffer.length;
    }

    // Auto-generate alerts on critical threshold breach
    if (risk.level === "critical" && dev.isOnline) {
      const existingActive = alerts.find(a => a.deviceId === dev.id && a.status === "active" && a.severity === "critical");
      if (!existingActive) {
        const newAlert: AlertNotification = {
          id: `ALT-${Date.now()}`,
          deviceId: dev.id,
          deviceName: dev.name,
          batchIds: dev.activeBatchIds,
          timestamp: nowIso,
          severity: "critical",
          title: `CRITICAL COLD CHAIN BREACH: ${dev.name}`,
          message: risk.anomaly || `Temperature reached ${newTemp}°C (Safe limit: ${dev.targetTempMin}°C to ${dev.targetTempMax}°C). Immediate intervention required.`,
          currentValue: newTemp,
          thresholdValue: newTemp > dev.targetTempMax ? dev.targetTempMax : dev.targetTempMin,
          parameter: "temperature",
          channelsDispatched: {
            email: true,
            sms: true,
            push: true,
            siren: true
          },
          status: "active"
        };
        alerts.unshift(newAlert);
      }
    }

    // Update associated batches current temp & cumulative excursion
    dev.activeBatchIds.forEach(batchId => {
      const b = batches.find(x => x.id === batchId);
      if (b) {
        b.currentTemp = newTemp;
        if (risk.level !== "safe") {
          b.cumulativeExcursionMinutes += 0.05; // 3 seconds = 0.05 min
          b.stabilityIndex = Math.max(0, Number((b.stabilityIndex - 0.02).toFixed(2)));
          if (b.status !== "quarantined" && b.status !== "discarded") {
            b.status = risk.level;
          }
        }
      }
    });

  });
}, 3500);

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "ECHELON Cold-Chain Engine",
    timestamp: new Date().toISOString(),
    devicesCount: devices.length,
    batchesCount: batches.length,
    activeAlerts: alerts.filter(a => a.status === "active").length,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. Devices endpoints
app.get("/api/devices", (req: Request, res: Response) => {
  res.json({ devices });
});

app.get("/api/devices/:id", (req: Request, res: Response) => {
  const dev = devices.find(d => d.id === req.params.id);
  if (!dev) {
    return res.status(404).json({ error: "Device not found" });
  }
  res.json({ device: dev });
});

// 3. Telemetry time-series endpoint
app.get("/api/devices/:id/telemetry", (req: Request, res: Response) => {
  const devId = req.params.id;
  const history = telemetryStorage.get(devId) || [];
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  res.json({
    deviceId: devId,
    readings: history.slice(-limit),
    bufferedCount: edgeOfflineBuffers.get(devId)?.length || 0
  });
});

// 4. Cloud Ingestion API — receives Edge SHT33 sensor packets
app.post("/api/ingest", (req: Request, res: Response) => {
  const { deviceId, readings } = req.body;
  if (!deviceId || !Array.isArray(readings)) {
    return res.status(400).json({ error: "Invalid payload: deviceId and readings array required" });
  }

  const dev = devices.find(d => d.id === deviceId);
  if (!dev) {
    return res.status(404).json({ error: "Device not registered in cold chain registry" });
  }

  const history = telemetryStorage.get(deviceId) || [];

  let validCount = 0;
  let rejectedCrc = 0;

  readings.forEach((r: Partial<SensorReading>) => {
    // SHT33 CRC check simulation
    if (r.crcValid === false) {
      rejectedCrc++;
      return;
    }

    const validReading: SensorReading = {
      id: r.id || `ING-${deviceId}-${Date.now()}-${Math.random()}`,
      deviceId,
      timestamp: r.timestamp || new Date().toISOString(),
      temperature: Number(r.temperature || dev.currentTemp),
      humidity: Number(r.humidity || dev.currentHumidity),
      ambientTemp: r.ambientTemp || 23.0,
      batteryLevel: r.batteryLevel || 95,
      signalStrength: r.signalStrength || -70,
      crcValid: true,
      bufferedAtEdge: Boolean(r.bufferedAtEdge),
      rateOfChange: r.rateOfChange || 0,
      riskScore: r.riskScore || 10,
      riskLevel: r.riskLevel || "safe",
      anomalyDetected: r.anomalyDetected
    };

    history.push(validReading);
    validCount++;
  });

  if (history.length > 200) {
    history.splice(0, history.length - 200);
  }
  telemetryStorage.set(deviceId, history);

  // Clear edge offline buffer if this was an edge sync operation
  edgeOfflineBuffers.set(deviceId, []);
  dev.bufferQueueCount = 0;
  dev.status = "active";
  dev.isOnline = true;

  res.json({
    status: "success",
    ingestedCount: validCount,
    rejectedCrc,
    bufferCleared: true,
    totalHistoryCount: history.length
  });
});

// 5. Edge Offline simulation toggle / reconnect
app.post("/api/devices/:id/toggle-connectivity", (req: Request, res: Response) => {
  const { id } = req.params;
  const dev = devices.find(d => d.id === id);
  if (!dev) return res.status(404).json({ error: "Device not found" });

  dev.isOnline = !dev.isOnline;
  dev.status = dev.isOnline ? "active" : "offline_buffering";

  // If restoring connection, auto-sync the offline edge buffer
  let syncedItemsCount = 0;
  if (dev.isOnline) {
    const offlineItems = edgeOfflineBuffers.get(dev.id) || [];
    if (offlineItems.length > 0) {
      const history = telemetryStorage.get(dev.id) || [];
      offlineItems.forEach(item => {
        item.bufferedAtEdge = true;
        history.push(item);
      });
      telemetryStorage.set(dev.id, history);
      syncedItemsCount = offlineItems.length;
      edgeOfflineBuffers.set(dev.id, []);
      dev.bufferQueueCount = 0;
    }
  }

  res.json({
    device: dev,
    syncedItemsCount,
    message: dev.isOnline 
      ? `Cellular/Satellite link restored. ${syncedItemsCount} offline buffered SHT33 packets synced to cloud.`
      : "Edge unit switched to OFFLINE mode. Telemetry is now buffering in local non-volatile flash memory."
  });
});

// 6. Batches endpoints
app.get("/api/batches", (req: Request, res: Response) => {
  res.json({ batches, profiles: VACCINE_PROFILES });
});

app.patch("/api/batches/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const b = batches.find(x => x.id === id);
  if (!b) return res.status(404).json({ error: "Batch not found" });

  const { status, notes, lastInspectedBy } = req.body;
  if (status) b.status = status;
  if (notes) b.notes = notes;
  if (lastInspectedBy) {
    b.lastInspectedBy = lastInspectedBy;
    b.lastInspectedAt = new Date().toISOString();
  }

  res.json({ batch: b });
});

// 7. Alerts endpoints
app.get("/api/alerts", (req: Request, res: Response) => {
  res.json({ alerts });
});

app.post("/api/alerts/:id/acknowledge", (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const { acknowledgedBy } = req.body;
  alert.status = "acknowledged";
  alert.acknowledgedBy = acknowledgedBy || "Clinical Operator";
  alert.acknowledgedAt = new Date().toISOString();

  res.json({ alert });
});

app.post("/api/alerts/:id/resolve", (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const { resolvedBy, correctiveActionTaken, notes } = req.body;
  alert.status = "resolved";
  alert.resolvedBy = resolvedBy || "QA Compliance Lead";
  alert.resolvedAt = new Date().toISOString();
  alert.correctiveActionTaken = correctiveActionTaken;
  alert.notes = notes;

  // Log action
  const action: CorrectiveActionLog = {
    id: `ACT-${Date.now()}`,
    alertId: alert.id,
    deviceId: alert.deviceId,
    batchIds: alert.batchIds,
    actionType: (correctiveActionTaken as any) || "Batch Approved for Clinical Administration",
    performedBy: resolvedBy || "QA Officer",
    userRole: "administrator",
    timestamp: new Date().toISOString(),
    preActionTemp: alert.currentValue,
    postActionTemp: 4.5,
    safetyStatusAssigned: "Safe to Administer",
    signature: `${resolvedBy || "QA Lead"} [VERIFIED]`,
    comments: notes || "Resolved via operator dashboard intervention."
  };
  actionLogs.unshift(action);

  res.json({ alert, action });
});

app.post("/api/alerts/test-dispatch", (req: Request, res: Response) => {
  const { channel, recipient, message } = req.body;
  res.json({
    status: "dispatched",
    channel,
    recipient: recipient || "coldchain-oncall@hospital.org",
    message: message || "ECHELON Test Alert Dispatch Notification",
    timestamp: new Date().toISOString(),
    providerLog: `Simulated carrier gateway ACK [200 OK] for ${channel.toUpperCase()}`
  });
});

// 8. Shipments endpoints
app.get("/api/shipments", (req: Request, res: Response) => {
  res.json({ shipments });
});

app.patch("/api/shipments/:id/handover", (req: Request, res: Response) => {
  const shipment = shipments.find(s => s.id === req.params.id);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const { vvmStagePassed, physicalSealIntact, dataLoggerDownloaded, receiverSignature, notes } = req.body;
  shipment.handoverChecklist = {
    vvmStagePassed: Boolean(vvmStagePassed),
    physicalSealIntact: Boolean(physicalSealIntact),
    dataLoggerDownloaded: Boolean(dataLoggerDownloaded),
    receiverSignature: receiverSignature || "Verified Healthcare Worker",
    notes
  };

  if (vvmStagePassed && physicalSealIntact && dataLoggerDownloaded) {
    shipment.status = "Delivered";
  } else {
    shipment.status = "Quarantined on Arrival";
  }

  res.json({ shipment });
});

// 9. Corrective actions log endpoint
app.get("/api/actions", (req: Request, res: Response) => {
  res.json({ actions: actionLogs });
});

app.post("/api/actions", (req: Request, res: Response) => {
  const body = req.body;
  const newAction: CorrectiveActionLog = {
    id: `ACT-${Date.now()}`,
    alertId: body.alertId,
    deviceId: body.deviceId,
    batchIds: body.batchIds || [],
    actionType: body.actionType || "Replaced Dry Ice / PCM Packs",
    performedBy: body.performedBy || "Operator",
    userRole: body.userRole || "healthcare_worker",
    timestamp: new Date().toISOString(),
    preActionTemp: body.preActionTemp,
    postActionTemp: body.postActionTemp,
    safetyStatusAssigned: body.safetyStatusAssigned || "Safe to Administer",
    signature: body.signature || "Digital Signature Token Verified",
    comments: body.comments || ""
  };

  actionLogs.unshift(newAction);

  // Update batch status if safety status assigned
  if (body.batchIds && Array.isArray(body.batchIds)) {
    body.batchIds.forEach((bId: string) => {
      const b = batches.find(x => x.id === bId);
      if (b) {
        if (body.safetyStatusAssigned === "Quarantined for Testing") {
          b.status = "quarantined";
        } else if (body.safetyStatusAssigned === "Discard / Invalidate") {
          b.status = "discarded";
        } else {
          b.status = "safe";
        }
      }
    });
  }

  res.json({ action: newAction });
});

// 10. AI Risk Engine & Diagnostic Analysis (Gemini powered)
app.post("/api/ai/analyze-risk", async (req: Request, res: Response) => {
  const { deviceId } = req.body;
  const dev = devices.find(d => d.id === deviceId) || devices[0];
  const history = telemetryStorage.get(dev.id) || [];
  const activeBatches = batches.filter(b => dev.activeBatchIds.includes(b.id));

  // Compute algorithmic metrics
  const recent10 = history.slice(-10);
  const temps = recent10.map(r => r.temperature);
  const currentTemp = dev.currentTemp;
  const roc = dev.rateOfChange;

  // Mean Kinetic Temperature (MKT) approximation:
  // T_k = (Delta H / R) / -ln( sum(exp(-Delta H / (R * T_i))) / n )
  const R = 8.314;
  const dH = 83144; // standard activation energy for pharma stability
  let sumExp = 0;
  temps.forEach(t => {
    const tKelvin = t + 273.15;
    sumExp += Math.exp(-dH / (R * tKelvin));
  });
  const mkt = Number(((dH / R) / -Math.log(sumExp / (temps.length || 1)) - 273.15).toFixed(2));

  // Calculate physics thermal decay estimate
  let decayMinutes = 999;
  if (currentTemp > dev.targetTempMax && roc > 0) {
    const margin = (dev.targetTempMax + 4.0) - currentTemp;
    decayMinutes = Math.max(5, Math.round((margin / roc) * 60));
  } else if (currentTemp < dev.targetTempMin && roc < 0) {
    const margin = currentTemp - (dev.targetTempMin - 2.0);
    decayMinutes = Math.max(5, Math.round((margin / Math.abs(roc)) * 60));
  }

  const predicted1h = Number((currentTemp + roc).toFixed(2));
  const baseRisk = calculateRisk(dev, currentTemp, roc);

  // Check if Gemini is available for high-fidelity thermodynamic evaluation
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are ECHELON's Lead Cold-Chain AI Pharmacist and Thermodynamicist.
Evaluate the cold-chain integrity for vaccine storage unit "${dev.name}" (${dev.code}, Type: ${dev.type}).
Target Range: ${dev.targetTempMin}°C to ${dev.targetTempMax}°C.
Current Temperature: ${currentTemp}°C.
Rate of Change: ${roc}°C/hr.
Calculated MKT (Mean Kinetic Temperature): ${mkt}°C.
Power Source: ${dev.powerSource}, Compressor State: ${dev.compressorState}, Door State: ${dev.doorState}.
Active Vaccines in Unit: ${activeBatches.map(b => `${b.vaccineName} (${b.quantityDoses} doses, Batch ${b.batchNumber})`).join(", ") || "General Pediatric Inventory"}.

Recent 10 Sensor Readings (°C): [${temps.join(", ")}].

Analyze root cause probabilities, biological viability degradation according to WHO PQS and Arrhenius kinetics, and specific regulatory corrective actions.
Return a STRICT JSON object in this exact schema:
{
  "riskScore": number (0 to 100),
  "riskCategory": "safe" | "warning" | "critical",
  "primaryRiskFactor": string,
  "thermalDecayTimeRemainingMinutes": number,
  "predictedTempIn1Hour": number,
  "anomalyDetected": string,
  "biologicalViabilityImpact": string,
  "mktAssessment": string,
  "recommendedAction": string,
  "rootCauseProbability": {
    "powerLoss": number,
    "sealLeak": number,
    "compressorFault": number,
    "ambientExtreme": number,
    "sensorDrift": number
  },
  "aiExplanation": string
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text?.trim() || "";
      const parsed = JSON.parse(text);
      return res.json({ result: parsed, source: "gemini-3.7-flash" });
    } catch (err: any) {
      console.warn("Gemini AI generation fallback to deterministic model:", err?.message);
    }
  }

  // Deterministic Fallback Engine
  const result: AiRiskAnalysisResult = {
    riskScore: baseRisk.score,
    riskCategory: baseRisk.level,
    primaryRiskFactor: baseRisk.anomaly || (currentTemp > dev.targetTempMax ? "Excursion Above Upper Threshold" : "Normal Temperature Operating Profile"),
    thermalDecayTimeRemainingMinutes: decayMinutes === 999 ? 180 : decayMinutes,
    predictedTempIn1Hour: predicted1h,
    anomalyDetected: baseRisk.anomaly || "Thermal stability within normal standard deviation (±0.4°C)",
    biologicalViabilityImpact: baseRisk.level === "critical"
      ? "High risk of tertiary protein denaturing and adjuvant phase separation. Doses must be quarantined immediately."
      : baseRisk.level === "warning"
      ? "Marginal thermal stress detected; cumulative degree-minute buffer depleting. Rapid mitigation recommended."
      : "Full antigenic potency preserved (100% biological titer). No accelerated decay.",
    mktAssessment: `Mean Kinetic Temperature is ${mkt}°C (Allowable boundary: ${dev.targetTempMin}°C to ${dev.targetTempMax}°C).`,
    recommendedAction: baseRisk.level === "critical"
      ? "Initiate Emergency Code Blue Protocol: Transfer inventory to backup cryo-vault and log quarantine report."
      : baseRisk.level === "warning"
      ? "Check door gasket seals, inspect compressor airflow, verify auxiliary cooling generator."
      : "Continue standard continuous telemetry monitoring schedule.",
    rootCauseProbability: {
      powerLoss: dev.powerSource === "Mains Grid" ? 20 : 10,
      sealLeak: dev.doorState !== "closed" ? 65 : 15,
      compressorFault: dev.compressorState === "fault" ? 85 : 10,
      ambientExtreme: 25,
      sensorDrift: 5
    },
    aiExplanation: `ECHELON AI model analyzed ${temps.length} high-frequency SHT33 sensor telemetry points. Mean kinetic temperature is evaluated at ${mkt}°C with a thermal velocity of ${roc > 0 ? '+' : ''}${roc}°C/hr. The thermodynamic profile demonstrates ${baseRisk.level.toUpperCase()} operational status.`
  };

  res.json({ result, source: "deterministic-rule-engine" });
});

// 11. Cold Chain Specialist AI Chat Copilot
app.post("/api/ai/chat-assistant", async (req: Request, res: Response) => {
  const { message, activeRole, deviceId } = req.body;
  const dev = devices.find(d => d.id === deviceId) || devices[0];
  const activeBatches = batches.filter(b => dev.activeBatchIds.includes(b.id));

  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemInstruction = `You are ECHELON Copilot, an expert AI vaccine cold chain specialist, biomedical engineer, and WHO PQS compliance advisor.
Current user role: ${activeRole || "Healthcare Worker"}.
Active unit in focus: ${dev.name} (${dev.code}, ${dev.type}).
Current Temp: ${dev.currentTemp}°C, Range: ${dev.targetTempMin}°C to ${dev.targetTempMax}°C, Rate of change: ${dev.rateOfChange}°C/hr, Status: ${dev.status}.
Active Batches: ${activeBatches.map(b => `${b.vaccineName} (Qty: ${b.quantityDoses})`).join("; ") || "None"}.

Provide clear, decisive, clinically sound, and actionable guidance for cold chain management, excursion containment, WHO Shake Test protocols, MKT interpretation, and vaccine salvageability. Keep answers concise, highly structured, and reassuring.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: message,
        config: {
          systemInstruction
        }
      });

      return res.json({ reply: response.text });
    } catch (err: any) {
      console.warn("Gemini Copilot fallback:", err?.message);
    }
  }

  // Fallback assistant reply
  let fallbackReply = `ECHELON Specialist Copilot: For unit ${dev.name} operating at ${dev.currentTemp}°C:\n\n` +
    `1. Target storage limits are ${dev.targetTempMin}°C to ${dev.targetTempMax}°C.\n` +
    `2. Current thermal rate of change is ${dev.rateOfChange > 0 ? '+' : ''}${dev.rateOfChange}°C/hr.\n` +
    `3. Always verify physical seal tightness, check PCM / Dry ice charge levels, and log all corrective actions with digital operator sign-off.\n` +
    `4. If an excursion exceeds allowable limits, isolate the lot and perform a WHO Shake Test for freeze-sensitive vaccines.`;

  res.json({ reply: fallbackReply });
});

// 12. Reports & Compliance export data
app.get("/api/reports/excursion-summary", (req: Request, res: Response) => {
  const excursions = devices.map(dev => {
    const history = telemetryStorage.get(dev.id) || [];
    const outOfBounds = history.filter(h => h.temperature < dev.targetTempMin || h.temperature > dev.targetTempMax);
    const maxTemp = history.reduce((max, h) => h.temperature > max ? h.temperature : max, -999);
    const minTemp = history.reduce((min, h) => h.temperature < min ? h.temperature : min, 999);

    return {
      deviceId: dev.id,
      deviceName: dev.name,
      deviceCode: dev.code,
      facility: dev.locationName,
      totalReadings: history.length,
      excursionCount: outOfBounds.length,
      excursionPercentage: Number(((outOfBounds.length / (history.length || 1)) * 100).toFixed(1)),
      maxRecordedTemp: maxTemp === -999 ? dev.currentTemp : maxTemp,
      minRecordedTemp: minTemp === 999 ? dev.currentTemp : minTemp,
      targetRange: `${dev.targetTempMin}°C to ${dev.targetTempMax}°C`,
      complianceStatus: outOfBounds.length === 0 ? "100% Compliant (WHO PQS Level A)" : outOfBounds.length < 3 ? "Minor Excursion (Level B)" : "Critical Excursion (Action Required)"
    };
  });

  res.json({
    generatedAt: new Date().toISOString(),
    standard: "WHO PQS & US FDA 21 CFR Part 11 Audit Trail",
    excursions,
    totalBatchesMonitored: batches.length,
    activeAlertsCount: alerts.filter(a => a.status === "active").length,
    actionsLoggedCount: actionLogs.length
  });
});

// 13. Chaos / Simulation triggers for interactive testing
app.post("/api/simulate/chaos", (req: Request, res: Response) => {
  const { type, deviceId } = req.body;
  const dev = devices.find(d => d.id === deviceId) || devices[0];

  switch (type) {
    case "door_open":
      dev.doorState = "open";
      dev.currentTemp = Number((dev.currentTemp + 4.2).toFixed(2));
      dev.rateOfChange = 2.4;
      break;
    case "compressor_failure":
      dev.compressorState = "fault";
      dev.currentTemp = Number((dev.currentTemp + 5.8).toFixed(2));
      dev.rateOfChange = 3.6;
      break;
    case "freeze_drop":
      dev.currentTemp = -1.5; // Freeze hazard for +2..+8 fridge
      dev.rateOfChange = -4.2;
      break;
    case "heat_spike":
      dev.currentTemp = Number((dev.targetTempMax + 6.5).toFixed(2));
      dev.rateOfChange = 4.8;
      break;
    case "normal_reset":
      dev.doorState = "closed";
      dev.compressorState = "running";
      dev.currentTemp = (dev.targetTempMin + dev.targetTempMax) / 2;
      dev.rateOfChange = 0.05;
      dev.status = "active";
      dev.isOnline = true;
      break;
    default:
      break;
  }

  res.json({
    message: `Chaos simulation scenario '${type}' applied to ${dev.name}`,
    device: dev
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER LAUNCH
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ECHELON] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
