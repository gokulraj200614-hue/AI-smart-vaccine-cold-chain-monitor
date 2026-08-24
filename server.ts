import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { 
  VaccineBatch, 
  EdgeDevice, 
  TransportJourney, 
  Alert, 
  TelemetryReading,
  CorrectiveActionLog,
  AuditLogEntry,
  DemoScenario,
  DeviceConnectivity,
  BatchStatus
} from './src/types';
import { 
  INITIAL_BATCHES, 
  INITIAL_DEVICES, 
  INITIAL_TRANSPORTS, 
  INITIAL_AUDIT_LOGS,
  generateInitialTelemetryHistory 
} from './src/utils/mockData';
import { 
  calculateAIRiskPrediction, 
  generatePreventiveRecommendations 
} from './src/utils/riskEngine';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
let batches: VaccineBatch[] = [...INITIAL_BATCHES];
let devices: EdgeDevice[] = [...INITIAL_DEVICES];
let transports: TransportJourney[] = [...INITIAL_TRANSPORTS];
let auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];
let alerts: Alert[] = [];
let correctiveActions: CorrectiveActionLog[] = [];
let activeBatchId: string = 'BATCH-2026-COV-01';
let activeScenario: DemoScenario = 'SAFE';
let deviceConnectivityMode: DeviceConnectivity = 'ONLINE';
let offlineBuffer: TelemetryReading[] = [];

// Telemetry store mapped by batchId
const telemetryStore: Map<string, TelemetryReading[]> = new Map();
batches.forEach((b) => {
  telemetryStore.set(b.id, generateInitialTelemetryHistory(b, 30));
});

// Gemini AI Helper
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    try {
      return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return null;
}

// Background simulation ticker (every 5 seconds)
let simTick = 0;
setInterval(() => {
  simTick++;
  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  const history = telemetryStore.get(activeBatch.id) || [];
  const lastReading = history[history.length - 1] || {
    temperature: activeBatch.idealTemp,
    humidity: 50,
  };

  let targetTemp = activeBatch.idealTemp;
  let targetHumidity = 50;

  if (activeScenario === 'SAFE') {
    targetTemp = activeBatch.idealTemp + Math.sin(simTick * 0.2) * 0.4;
    targetHumidity = 48 + Math.cos(simTick * 0.2) * 3;
  } else if (activeScenario === 'WARNING') {
    // Gradual rise to 8.8°C
    const progress = Math.min(1, simTick * 0.05);
    targetTemp = 7.2 + progress * 1.8 + Math.random() * 0.2;
    targetHumidity = 58 + Math.random() * 4;
  } else if (activeScenario === 'CRITICAL') {
    // Rapid climb to 11.5°C - 13.5°C
    const progress = Math.min(1, simTick * 0.08);
    targetTemp = 9.0 + progress * 3.5 + Math.random() * 0.3;
    targetHumidity = 68 + Math.random() * 5;
  } else if (activeScenario === 'RECOVERY') {
    // Dropping back down to safe 4.5°C
    const cur = lastReading.temperature;
    targetTemp = Math.max(activeBatch.idealTemp, cur - 0.4 + (Math.random() * 0.1 - 0.05));
    targetHumidity = 52 + Math.random() * 2;
  }

  const newReading: TelemetryReading = {
    id: `TEL-${activeBatch.id}-${Date.now()}`,
    deviceId: activeBatch.deviceId,
    batchId: activeBatch.id,
    storageUnitId: activeBatch.storageUnitId,
    timestamp: new Date().toISOString(),
    temperature: Number(targetTemp.toFixed(2)),
    humidity: Number(targetHumidity.toFixed(1)),
    isValid: true,
    rawStatus: targetTemp > activeBatch.maxTemp || targetTemp < activeBatch.minTemp ? 'OUT_OF_RANGE' : 'NORMAL',
    edgeBuffered: deviceConnectivityMode === 'OFFLINE',
    gps: activeBatch.isTransport
      ? { lat: 37.5485 + (Math.sin(simTick * 0.1) * 0.01), lng: -122.2711 + (simTick * 0.002), locationName: 'Highway 101 Corridor', speed: 82 }
      : { lat: 37.7749, lng: -122.4194, locationName: 'Central Depot Vault' },
    batteryLevel: Math.max(15, 98 - Math.floor(simTick / 20)),
    signalRssi: deviceConnectivityMode === 'OFFLINE' ? -110 : -64,
  };

  if (deviceConnectivityMode === 'OFFLINE') {
    offlineBuffer.push(newReading);
    const dev = devices.find((d) => d.id === activeBatch.deviceId);
    if (dev) {
      dev.bufferCount = offlineBuffer.length;
      dev.connectivity = 'OFFLINE';
    }
  } else if (deviceConnectivityMode === 'SYNCHRONIZING') {
    // Flush buffer into store
    if (offlineBuffer.length > 0) {
      history.push(...offlineBuffer);
      offlineBuffer = [];
    }
    history.push(newReading);
    deviceConnectivityMode = 'ONLINE';
    const dev = devices.find((d) => d.id === activeBatch.deviceId);
    if (dev) {
      dev.bufferCount = 0;
      dev.connectivity = 'ONLINE';
      dev.lastSync = new Date().toISOString();
    }
  } else {
    // ONLINE
    history.push(newReading);
    if (history.length > 100) history.shift();
  }
  telemetryStore.set(activeBatch.id, history);

  // Recalculate AI Prediction & Alerts
  const prediction = calculateAIRiskPrediction(activeBatch, history);
  
  // Update batch status based on risk
  if (prediction.riskClassification === 'CRITICAL' && activeBatch.currentStatus !== 'QUARANTINED') {
    activeBatch.currentStatus = 'CRITICAL';
    
    // Check if we need to fire alert
    const existingActiveAlert = alerts.find(
      (a) => a.batchId === activeBatch.id && !a.resolved && a.severity === 'CRITICAL'
    );
    if (!existingActiveAlert) {
      const newAlert: Alert = {
        id: `ALT-${Date.now()}`,
        batchId: activeBatch.id,
        batchName: activeBatch.vaccineName,
        deviceId: activeBatch.deviceId,
        severity: 'CRITICAL',
        title: `CRITICAL: Spoilage Risk on ${activeBatch.vaccineName}`,
        message: `Current temp is ${newReading.temperature}°C (Safe range: ${activeBatch.minTemp}-${activeBatch.maxTemp}°C). Risk Score: ${prediction.riskScore}/100. Predicted critical threshold in ${prediction.estimatedTimeUntilSpoilageSeconds ? Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60) : 10} minutes.`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false,
        currentTemp: newReading.temperature,
        riskScore: prediction.riskScore,
        timeToCriticalExposureMinutes: prediction.estimatedTimeUntilSpoilageSeconds ? Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60) : 10,
        recommendedAction: 'Transfer the batch to an approved temperature-controlled storage unit immediately.',
        notificationChannels: { dashboard: true, smsSent: true, emailSent: true }
      };
      alerts.unshift(newAlert);

      auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: 'ECHELON AI Risk Engine',
        userRole: 'ADMINISTRATOR',
        action: 'CRITICAL_ALERT_TRIGGERED',
        entityType: 'ALERT',
        entityId: newAlert.id,
        details: `Dispatched multi-channel alert for batch ${activeBatch.id} (Temp: ${newReading.temperature}°C, Risk: ${prediction.riskScore}).`
      });
    }
  } else if (prediction.riskClassification === 'WARNING' && activeBatch.currentStatus === 'SAFE') {
    activeBatch.currentStatus = 'EARLY_WARNING';
  } else if (prediction.riskClassification === 'SAFE' && (activeBatch.currentStatus === 'CRITICAL' || activeBatch.currentStatus === 'EARLY_WARNING')) {
    activeBatch.currentStatus = 'STABILIZED';
  }
}, 4000);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), activeScenario });
});

app.get('/api/state', (req, res) => {
  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  const history = telemetryStore.get(activeBatch.id) || [];
  const latestTelemetry = history[history.length - 1] || null;
  const prediction = calculateAIRiskPrediction(activeBatch, history);
  const recommendations = generatePreventiveRecommendations(
    activeBatch,
    prediction,
    latestTelemetry ? latestTelemetry.temperature : activeBatch.idealTemp,
    activeBatch.isTransport
  );

  res.json({
    batches,
    activeBatchId,
    activeBatch,
    latestTelemetry,
    prediction,
    recommendations,
    devices,
    transports,
    alerts,
    correctiveActions,
    auditLogs: auditLogs.slice(0, 50),
    activeScenario,
    deviceConnectivityMode,
    offlineBufferCount: offlineBuffer.length,
    recentTelemetry: history.slice(-40),
  });
});

app.post('/api/batch/select', (req, res) => {
  const { batchId } = req.body;
  if (batchId && batches.some((b) => b.id === batchId)) {
    activeBatchId = batchId;
  }
  res.json({ success: true, activeBatchId });
});

app.post('/api/simulation/scenario', (req, res) => {
  const { scenario, customTemp } = req.body;
  activeScenario = scenario;
  simTick = 0;

  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
  
  if (scenario === 'SAFE') {
    activeBatch.currentStatus = 'SAFE';
  } else if (scenario === 'WARNING') {
    activeBatch.currentStatus = 'EARLY_WARNING';
  } else if (scenario === 'CRITICAL') {
    activeBatch.currentStatus = 'CRITICAL';
  } else if (scenario === 'RECOVERY') {
    activeBatch.currentStatus = 'STABILIZED';
  }

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userName: req.body.userName || 'System Operator',
    userRole: 'ADMINISTRATOR',
    action: 'SIMULATION_SCENARIO_CHANGED',
    entityType: 'SIMULATION',
    entityId: scenario,
    details: `Simulation shifted to scenario [${scenario}] for demonstration testing.`
  });

  res.json({ success: true, activeScenario });
});

app.post('/api/simulation/toggle-connectivity', (req, res) => {
  const { mode } = req.body;
  if (['ONLINE', 'OFFLINE', 'SYNCHRONIZING'].includes(mode)) {
    deviceConnectivityMode = mode;
    const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];
    const dev = devices.find((d) => d.id === activeBatch.deviceId);
    if (dev) {
      dev.connectivity = mode;
      if (mode === 'SYNCHRONIZING') {
        const history = telemetryStore.get(activeBatch.id) || [];
        history.push(...offlineBuffer);
        offlineBuffer = [];
        dev.bufferCount = 0;
        dev.lastSync = new Date().toISOString();
        deviceConnectivityMode = 'ONLINE';
        dev.connectivity = 'ONLINE';
      }
    }

    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: req.body.userName || 'Edge Node Gateway',
      userRole: 'ADMINISTRATOR',
      action: 'DEVICE_CONNECTIVITY_CHANGED',
      entityType: 'DEVICE',
      entityId: activeBatch.deviceId,
      details: `Hardware SHT33 link state switched to [${mode}]. Edge buffer depth: ${offlineBuffer.length} records.`
    });
  }

  res.json({ success: true, deviceConnectivityMode, bufferCount: offlineBuffer.length });
});

app.post('/api/alerts/:id/ack', (req, res) => {
  const { id } = req.params;
  const { userName, userRole } = req.body;
  const alert = alerts.find((a) => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = userName || 'Dr. Elena Rostova';
    alert.acknowledgedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: userName || 'Dr. Elena Rostova',
      userRole: userRole || 'HEALTHCARE_WORKER',
      action: 'ALERT_ACKNOWLEDGED',
      entityType: 'ALERT',
      entityId: id,
      details: `User acknowledged excursion alert on ${alert.batchName}. Initiating clinical response protocol.`
    });
  }
  res.json({ success: true, alert });
});

app.post('/api/corrective-actions', (req, res) => {
  const { 
    batchId, 
    alertId, 
    actionType, 
    notes, 
    performedBy, 
    newStatus,
    targetTemp 
  } = req.body;

  const batch = batches.find((b) => b.id === batchId);
  const history = telemetryStore.get(batchId) || [];
  const latest = history[history.length - 1];
  const prevPrediction = batch ? calculateAIRiskPrediction(batch, history) : { riskScore: 85 };

  if (batch) {
    batch.currentStatus = newStatus || 'UNDER_ASSESSMENT';
  }

  // If action was to transfer or cool, inject a recovering reading
  const recheckedTemp = targetTemp || (batch ? batch.idealTemp + 0.3 : 4.8);
  const newReading: TelemetryReading = {
    id: `TEL-${batchId}-${Date.now()}`,
    deviceId: batch?.deviceId || 'SHT33-EDGE-01',
    batchId,
    storageUnitId: batch?.storageUnitId || 'COLD-ROOM-ALPHA',
    timestamp: new Date().toISOString(),
    temperature: recheckedTemp,
    humidity: 50.0,
    isValid: true,
    rawStatus: 'NORMAL',
    edgeBuffered: false,
    gps: { lat: 37.7749, lng: -122.4194, locationName: 'Post-Action Recheck' },
    batteryLevel: 95,
    signalRssi: -60,
  };
  history.push(newReading);
  telemetryStore.set(batchId, history);

  const newLog: CorrectiveActionLog = {
    id: `ACT-LOG-${Date.now()}`,
    batchId,
    alertId,
    actionType,
    notes: notes || 'Executed standard cold-chain excursion mitigation SOP.',
    actionTime: new Date().toISOString(),
    performedBy: performedBy || 'Dr. Elena Rostova, PharmD',
    previousRiskScore: prevPrediction.riskScore,
    newRiskScore: 18,
    previousStatus: batch?.currentStatus || 'CRITICAL',
    newStatus: newStatus || 'UNDER_ASSESSMENT',
    recheckedTemp,
  };

  correctiveActions.unshift(newLog);

  // Resolve associated alert
  if (alertId) {
    const al = alerts.find((a) => a.id === alertId);
    if (al) {
      al.resolved = true;
    }
  }

  // Set scenario to recovery
  activeScenario = 'RECOVERY';

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userName: performedBy || 'Dr. Elena Rostova, PharmD',
    userRole: 'HEALTHCARE_WORKER',
    action: 'CORRECTIVE_ACTION_LOGGED',
    entityType: 'CORRECTIVE_ACTION',
    entityId: newLog.id,
    details: `SOP Action [${actionType}] executed on ${batchId}. Batch status updated to [${newStatus}]. Rechecked temperature: ${recheckedTemp}°C.`
  });

  res.json({ success: true, log: newLog });
});

app.post('/api/batches', (req, res) => {
  const newBatch: VaccineBatch = {
    ...req.body,
    id: req.body.id || `BATCH-${Date.now().toString().slice(-6)}`,
    currentStatus: 'SAFE',
  };
  batches.push(newBatch);
  telemetryStore.set(newBatch.id, generateInitialTelemetryHistory(newBatch, 20));

  auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userName: 'Director Arthur Sterling',
    userRole: 'ADMINISTRATOR',
    action: 'VACCINE_BATCH_REGISTERED',
    entityType: 'BATCH',
    entityId: newBatch.id,
    details: `Registered new batch ${newBatch.vaccineName} (${newBatch.quantity} doses). Safe limits: ${newBatch.minTemp}°C - ${newBatch.maxTemp}°C.`
  });

  res.json({ success: true, batch: newBatch });
});

app.patch('/api/batches/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, userName, userRole, notes } = req.body;
  const batch = batches.find((b) => b.id === id);
  if (batch) {
    const oldStatus = batch.currentStatus;
    batch.currentStatus = status;

    auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: userName || 'Dr. Elena Rostova',
      userRole: userRole || 'HEALTHCARE_WORKER',
      action: 'BATCH_STATUS_UPDATED',
      entityType: 'BATCH',
      entityId: id,
      details: `Status transitioned from [${oldStatus}] -> [${status}]. Assessment notes: ${notes || 'Clinical protocol review completed.'}`
    });
    return res.json({ success: true, batch });
  }
  res.status(404).json({ error: 'Batch not found' });
});

app.post('/api/ai/deep-analysis', async (req, res) => {
  const { batchId } = req.body;
  const batch = batches.find((b) => b.id === batchId) || batches[0];
  const history = telemetryStore.get(batch.id) || [];
  const prediction = calculateAIRiskPrediction(batch, history);
  const latest = history[history.length - 1];

  const genAI = getGeminiClient();
  if (genAI) {
    try {
      const prompt = `You are ECHELON's Lead Clinical Cold-Chain AI Pharmacist and Thermostability Expert.
Analyze the following real-time vaccine thermal excursion telemetry and provide a structured, high-stakes, explainable clinical assessment.

Vaccine Profile:
- Vaccine: ${batch.vaccineName} (${batch.manufacturer})
- Batch ID: ${batch.id}
- Quantity: ${batch.quantity.toLocaleString()} doses ($${(batch.quantity * batch.unitCost).toLocaleString()} value)
- Standard Safe Storage: ${batch.minTemp}°C to ${batch.maxTemp}°C
- Maximum Allowable Excursion Budget: ${batch.maxAllowedExcursionMinutes} minutes
- Critical Degradation Threshold: ${batch.criticalExcursionMinutes} minutes at >${batch.criticalUpperTemp}°C

Current Telemetry:
- Current Temperature: ${latest ? latest.temperature : batch.idealTemp}°C
- Current Humidity: ${latest ? latest.humidity : 50}%
- Rate of Thermal Change: ${prediction.rateOfChangeCPerMin}°C/min (${prediction.temperatureTrend})
- Cumulative Unsafe Exposure Duration: ${prediction.estimatedExposureDurationMinutes} minutes
- Current Risk Score: ${prediction.riskScore}/100 (${prediction.riskClassification})
- Estimated Time Remaining to Irreversible Protein Denaturation: ${prediction.estimatedTimeUntilSpoilageSeconds ? Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60) : 'N/A'} minutes

Please provide:
1. Executive Root-Cause Assessment (Why is this excursion dangerous for this specific biological mechanism?)
2. Kinetic Thermal Budget Analysis (How much allowable molecular stability margin remains?)
3. Operational Action Roadmap (Numbered priority steps for the on-site clinical or courier team)
4. Regulatory & Release Guidance (Clear disclaimer that final release requires physical inspection/shake test and manufacturer monograph compliance).

Keep your response structured, precise, professional, and directly actionable.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        analysis: response.text,
        generatedAt: new Date().toISOString(),
        model: 'gemini-3.7-flash',
      });
    } catch (err) {
      console.error('Gemini call error:', err);
    }
  }

  // Fallback high-precision algorithmic synthesis if Gemini API key not present
  const fallbackAnalysis = `### Executive Cold-Chain Assessment: ${batch.vaccineName} (${batch.id})

**1. Thermostability Risk Profile**
Current sensor telemetry shows the batch at **${latest ? latest.temperature : batch.idealTemp}°C**, which ${latest && latest.temperature > batch.maxTemp ? `exceeds the recommended upper threshold (${batch.maxTemp}°C) by +${(latest.temperature - batch.maxTemp).toFixed(1)}°C` : 'is currently within acceptable kinetic limits'}. With a thermal climb rate of **${prediction.rateOfChangeCPerMin > 0 ? '+' : ''}${prediction.rateOfChangeCPerMin}°C/min**, cumulative degree-minute thermal stress is accelerating molecular entropy.

**2. Kinetic Degradation Budget Analysis**
- **Calculated Exposure Duration:** ${prediction.estimatedExposureDurationMinutes} minutes of cumulative thermal excursion.
- **Remaining Critical Margin:** ${prediction.estimatedTimeUntilSpoilageSeconds ? `${Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60)} minutes` : 'Nominal buffer available'}.
- **Risk Index:** ${prediction.riskScore}/100 [${prediction.riskClassification}].

**3. Actionable Mitigation Roadmap**
1. **Immediate Transfer:** Move all ${batch.quantity.toLocaleString()} doses to auxiliary validated cold-storage (2.0°C – 8.0°C).
2. **Lockout & Quarantine:** Mark batch as "Under Assessment" in ECHELON to prevent premature clinical administration.
3. **Monograph Audit:** Document exact start/peak/recovery timestamps for manufacturer stability consultation.

*Note: ECHELON recommendations provide operational guidance. Final vaccine release must follow manufacturer monographs and applicable public health protocols.*`;

  return res.json({
    success: true,
    analysis: fallbackAnalysis,
    generatedAt: new Date().toISOString(),
    model: 'ECHELON-Algorithmic-RuleEngine',
  });
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ECHELON Cold-Chain Server running on port ${PORT}`);
  });
}

startServer();
