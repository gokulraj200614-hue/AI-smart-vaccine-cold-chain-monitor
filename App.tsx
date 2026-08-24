import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InteractiveAlertBanner } from './components/InteractiveAlertBanner';
import { DashboardView } from './components/DashboardView';
import { SensorSimulatorView } from './components/SensorSimulatorView';
import { VaccineBatchesView } from './components/VaccineBatchesView';
import { TransportMapView } from './components/TransportMapView';
import { AIRiskEngineView } from './components/AIRiskEngineView';
import { CorrectiveActionsView } from './components/CorrectiveActionsView';
import { CorrectiveActionModal } from './components/CorrectiveActionModal';
import { AlertsView } from './components/AlertsView';
import { ReportsComplianceView } from './components/ReportsComplianceView';
import { EdgeDevicesView } from './components/EdgeDevicesView';
import { AuditLogsView } from './components/AuditLogsView';
import { 
  VaccineBatch, 
  AIRiskPrediction, 
  PreventiveActionRecommendation, 
  TelemetryReading, 
  EdgeDevice, 
  TransportJourney, 
  Alert, 
  CorrectiveActionLog, 
  AuditLogEntry, 
  UserProfile, 
  DemoScenario, 
  DeviceConnectivity,
  BatchStatus 
} from './types';
import { 
  INITIAL_BATCHES, 
  INITIAL_DEVICES, 
  INITIAL_TRANSPORTS, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS,
  generateInitialTelemetryHistory 
} from './utils/mockData';
import { calculateAIRiskPrediction, generatePreventiveRecommendations } from './utils/riskEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [allUsers] = useState<UserProfile[]>(INITIAL_USERS);

  // Core Application State
  const [batches, setBatches] = useState<VaccineBatch[]>(INITIAL_BATCHES);
  const [activeBatchId, setActiveBatchId] = useState<string>(INITIAL_BATCHES[0].id);
  const [devices, setDevices] = useState<EdgeDevice[]>(INITIAL_DEVICES);
  const [transports, setTransports] = useState<TransportJourney[]>(INITIAL_TRANSPORTS);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveActionLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  
  // Real-time State & Telemetry
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryReading | null>(null);
  const [recentTelemetry, setRecentTelemetry] = useState<TelemetryReading[]>([]);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>('SAFE');
  const [deviceConnectivity, setDeviceConnectivity] = useState<DeviceConnectivity>('ONLINE');
  const [bufferCount, setBufferCount] = useState<number>(0);

  // Modal State
  const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState(false);
  const [selectedActionRec, setSelectedActionRec] = useState<PreventiveActionRecommendation | undefined>(undefined);
  const [targetAlertForAction, setTargetAlertForAction] = useState<Alert | null>(null);

  // Find active batch object
  const activeBatch = batches.find((b) => b.id === activeBatchId) || batches[0];

  // Fetch real-time state from server
  const fetchServerState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.batches) setBatches(data.batches);
        if (data.devices) setDevices(data.devices);
        if (data.transports) setTransports(data.transports);
        if (data.alerts) setAlerts(data.alerts);
        if (data.correctiveActions) setCorrectiveActions(data.correctiveActions);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.activeScenario) setActiveScenario(data.activeScenario);
        if (data.deviceConnectivityMode) setDeviceConnectivity(data.deviceConnectivityMode);
        if (data.offlineBufferCount !== undefined) setBufferCount(data.offlineBufferCount);
        if (data.latestTelemetry) setLatestTelemetry(data.latestTelemetry);
        if (data.recentTelemetry) setRecentTelemetry(data.recentTelemetry);
      }
    } catch (e) {
      // Fallback local calculation if backend is booting
      const fallbackHistory = recentTelemetry.length > 0 ? recentTelemetry : generateInitialTelemetryHistory(activeBatch, 20);
      setRecentTelemetry(fallbackHistory);
      setLatestTelemetry(fallbackHistory[fallbackHistory.length - 1]);
    }
  };

  // Polling state interval
  useEffect(() => {
    fetchServerState();
    const interval = setInterval(fetchServerState, 3000);
    return () => clearInterval(interval);
  }, [activeBatchId]);

  // Derived AI Risk & Recommendations
  const prediction: AIRiskPrediction = calculateAIRiskPrediction(
    activeBatch,
    recentTelemetry
  );

  const recommendations: PreventiveActionRecommendation[] = generatePreventiveRecommendations(
    activeBatch,
    prediction,
    latestTelemetry ? latestTelemetry.temperature : activeBatch.idealTemp,
    activeBatch.isTransport
  );

  // Active unacknowledged alert for current batch
  const activeBatchAlert = alerts.find(
    (a) => a.batchId === activeBatch.id && !a.resolved
  ) || null;

  // Handlers
  const handleSelectScenario = async (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    try {
      await fetch('/api/simulation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userName: currentUser.name,
        }),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleConnectivity = async (mode: DeviceConnectivity) => {
    setDeviceConnectivity(mode);
    try {
      await fetch('/api/simulation/toggle-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          userName: currentUser.name,
        }),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordCorrectiveAction = async (actionData: {
    batchId: string;
    alertId?: string;
    actionType: string;
    notes: string;
    performedBy: string;
    newStatus: BatchStatus;
    targetTemp: number;
  }) => {
    try {
      await fetch('/api/corrective-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewBatch = async (newBatchData: Partial<VaccineBatch>) => {
    try {
      await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatchData),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBatchStatus = async (batchId: string, status: BatchStatus, notes?: string) => {
    try {
      await fetch(`/api/batches/${batchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          userName: currentUser.name,
          userRole: currentUser.role,
          notes,
        }),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectBatch = async (batchId: string) => {
    setActiveBatchId(batchId);
    try {
      await fetch('/api/batch/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      fetchServerState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectManualReading = (temp: number, humidity: number) => {
    const newReading: TelemetryReading = {
      id: `TEL-${activeBatch.id}-${Date.now()}`,
      deviceId: activeBatch.deviceId,
      batchId: activeBatch.id,
      storageUnitId: activeBatch.storageUnitId,
      timestamp: new Date().toISOString(),
      temperature: temp,
      humidity,
      isValid: true,
      rawStatus: temp > activeBatch.maxTemp || temp < activeBatch.minTemp ? 'OUT_OF_RANGE' : 'NORMAL',
      edgeBuffered: false,
      gps: { lat: 37.7749, lng: -122.4194, locationName: 'Manual SHT33 Sensor Injector' },
      batteryLevel: 98,
      signalRssi: -62,
    };
    const updated = [...recentTelemetry, newReading];
    setRecentTelemetry(updated);
    setLatestTelemetry(newReading);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation & Scenario Controller */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={allUsers}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        deviceConnectivity={deviceConnectivity}
        onToggleConnectivity={handleToggleConnectivity}
        bufferCount={bufferCount}
        alerts={alerts}
        onOpenAlerts={() => setActiveTab('alerts')}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Interactive Alert Banner (Always visible if active batch is in Excursion/Warning) */}
        <InteractiveAlertBanner
          batch={activeBatch}
          prediction={prediction}
          latestTelemetry={latestTelemetry}
          activeAlert={activeBatchAlert}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onOpenCorrectiveAction={() => {
            setTargetAlertForAction(activeBatchAlert);
            setSelectedActionRec(recommendations[0]);
            setIsCorrectiveModalOpen(true);
          }}
          onViewBatchHistory={() => setActiveTab('batches')}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            activeBatch={activeBatch}
            allBatches={batches}
            prediction={prediction}
            recommendations={recommendations}
            latestTelemetry={latestTelemetry}
            recentTelemetry={recentTelemetry}
            deviceConnectivity={deviceConnectivity}
            bufferCount={bufferCount}
            onSelectBatch={handleSelectBatch}
            onOpenCorrectiveActionModal={(rec) => {
              setSelectedActionRec(rec);
              setTargetAlertForAction(activeBatchAlert);
              setIsCorrectiveModalOpen(true);
            }}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'sensor' && (
          <SensorSimulatorView
            devices={devices}
            activeBatch={activeBatch}
            latestTelemetry={latestTelemetry}
            recentTelemetry={recentTelemetry}
            deviceConnectivity={deviceConnectivity}
            bufferCount={bufferCount}
            onToggleConnectivity={handleToggleConnectivity}
            onInjectManualReading={handleInjectManualReading}
          />
        )}

        {activeTab === 'batches' && (
          <VaccineBatchesView
            batches={batches}
            activeBatchId={activeBatchId}
            onSelectBatch={handleSelectBatch}
            onAddNewBatch={handleAddNewBatch}
            onUpdateBatchStatus={handleUpdateBatchStatus}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'transport' && (
          <TransportMapView
            transports={transports}
            batch={activeBatch}
            latestTelemetry={latestTelemetry}
            onUpdateJourneyStatus={(jId, cond) => {
              const tr = transports.find((t) => t.id === jId);
              if (tr) {
                tr.arrivalCondition = cond;
                setTransports([...transports]);
              }
            }}
          />
        )}

        {activeTab === 'ai-engine' && (
          <AIRiskEngineView
            batch={activeBatch}
            prediction={prediction}
            latestTelemetry={latestTelemetry}
          />
        )}

        {activeTab === 'actions' && (
          <CorrectiveActionsView
            logs={correctiveActions}
            batches={batches}
            currentUser={currentUser}
            onOpenNewActionModal={() => {
              setSelectedActionRec(recommendations[0]);
              setTargetAlertForAction(activeBatchAlert);
              setIsCorrectiveModalOpen(true);
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onOpenCorrectiveAction={(alert) => {
              setTargetAlertForAction(alert);
              setIsCorrectiveModalOpen(true);
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsComplianceView
            batches={batches}
            correctiveLogs={correctiveActions}
            alerts={alerts}
            auditLogs={auditLogs}
            transports={transports}
          />
        )}

        {activeTab === 'devices' && (
          <EdgeDevicesView
            devices={devices}
            deviceConnectivity={deviceConnectivity}
            bufferCount={bufferCount}
            onToggleConnectivity={handleToggleConnectivity}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogsView auditLogs={auditLogs} />
        )}

      </main>

      {/* Corrective Action Modal */}
      <CorrectiveActionModal
        isOpen={isCorrectiveModalOpen}
        onClose={() => setIsCorrectiveModalOpen(false)}
        batch={activeBatch}
        currentTemp={latestTelemetry ? latestTelemetry.temperature : activeBatch.idealTemp}
        initialRecommendation={selectedActionRec}
        currentUser={currentUser}
        activeAlert={targetAlertForAction}
        onSubmitAction={handleRecordCorrectiveAction}
      />

      {/* Footer Status Bar */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            ECHELON Cold-Chain Sentinel Engine
          </span>
          <span className="text-slate-600">|</span>
          <span>ISO 13485 & WHO PQS Standards Architecture</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Active Operator: <strong className="text-cyan-300">{currentUser.name}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">Edge Protocol: SHT33-v2</span>
        </div>
      </footer>
    </div>
  );
}
