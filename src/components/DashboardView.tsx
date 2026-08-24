import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Snowflake, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  Wrench,
  Sparkles,
  Boxes
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Area, 
  ComposedChart 
} from 'recharts';
import { 
  VaccineBatch, 
  AIRiskPrediction, 
  PreventiveActionRecommendation, 
  TelemetryReading, 
  DeviceConnectivity,
  Alert
} from '../types';
import { formatDurationHuman } from '../utils/riskEngine';

interface DashboardViewProps {
  activeBatch: VaccineBatch;
  allBatches: VaccineBatch[];
  prediction: AIRiskPrediction;
  recommendations: PreventiveActionRecommendation[];
  latestTelemetry: TelemetryReading | null;
  recentTelemetry: TelemetryReading[];
  deviceConnectivity: DeviceConnectivity;
  bufferCount: number;
  onSelectBatch: (batchId: string) => void;
  onOpenCorrectiveActionModal: (preselectedAction?: PreventiveActionRecommendation) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeBatch,
  allBatches,
  prediction,
  recommendations,
  latestTelemetry,
  recentTelemetry,
  deviceConnectivity,
  bufferCount,
  onSelectBatch,
  onOpenCorrectiveActionModal,
  onNavigateToTab,
}) => {
  const currentTemp = latestTelemetry ? latestTelemetry.temperature : activeBatch.idealTemp;
  const currentHumidity = latestTelemetry ? latestTelemetry.humidity : 50;

  // Chart data formatting
  const chartData = recentTelemetry.map((r, index) => {
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      time: timeStr,
      temp: r.temperature,
      humidity: r.humidity,
      minSafe: activeBatch.minTemp,
      maxSafe: activeBatch.maxTemp,
      ideal: activeBatch.idealTemp,
    };
  });

  // Calculate Risk Gauge Color & Angle
  const getRiskColor = (score: number) => {
    if (score >= 71) return { text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500', gradient: 'from-rose-500 to-red-600' };
    if (score >= 31) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500', gradient: 'from-amber-400 to-orange-500' };
    return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500', gradient: 'from-emerald-400 to-teal-500' };
  };

  const riskColors = getRiskColor(prediction.riskScore);

  return (
    <div className="space-y-6">
      {/* Top Active Batch Selector & High-level Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Currently Monitoring Storage Unit
            </div>
            <div className="flex items-center gap-2">
              <select
                id="select-active-batch"
                value={activeBatch.id}
                onChange={(e) => onSelectBatch(e.target.value)}
                className="text-base font-bold text-white bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
              >
                {allBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.vaccineName} — {b.storageUnitName} ({b.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Edge Device Connectivity Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Edge Gateway:</span>
            {deviceConnectivity === 'ONLINE' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            )}
            {deviceConnectivity === 'OFFLINE' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                Offline ({bufferCount} buffered)
              </span>
            )}
            {deviceConnectivity === 'SYNCHRONIZING' && (
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing...
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('ai-engine')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explainable AI Engine</span>
          </button>
        </div>
      </div>

      {/* CORE 3-PILLAR DECISION FRAMEWORK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PILLAR 1: "WHAT IS HAPPENING?" */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Thermometer className="w-24 h-24 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold border border-cyan-800">
                1
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                What is Happening?
              </h3>
            </div>

            {/* Current Temperature & Humidity Display */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Temperature</span>
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-extrabold font-mono ${
                    currentTemp > activeBatch.maxTemp ? 'text-rose-400' :
                    currentTemp < activeBatch.minTemp ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {currentTemp.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400">°C</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Safe: {activeBatch.minTemp}°C – {activeBatch.maxTemp}°C
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Relative Humidity</span>
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-slate-100">
                    {currentHumidity.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400">%</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Safe: {activeBatch.minHumidity}% – {activeBatch.maxHumidity}%
                </div>
              </div>
            </div>

            {/* AI Risk Score Gauge Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">Continuous AI Risk Score</span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  prediction.riskClassification === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  prediction.riskClassification === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {prediction.riskClassification}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black font-mono text-white">
                  {prediction.riskScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${riskColors.gradient}`}
                    style={{ width: `${Math.max(5, prediction.riskScore)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Thermal Rate of Change */}
            <div className="flex items-center justify-between text-xs px-1 text-slate-400">
              <span className="flex items-center gap-1">
                {prediction.rateOfChangeCPerMin > 0 ? (
                  <TrendingUp className="w-4 h-4 text-rose-400" />
                ) : prediction.rateOfChangeCPerMin < 0 ? (
                  <TrendingDown className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Minus className="w-4 h-4 text-slate-500" />
                )}
                <span>Rate of Change:</span>
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {prediction.rateOfChangeCPerMin > 0 ? `+${prediction.rateOfChangeCPerMin}` : prediction.rateOfChangeCPerMin} °C/min ({prediction.temperatureTrend})
              </span>
            </div>
          </div>
        </div>

        {/* PILLAR 2: "WHEN COULD IT BECOME DANGEROUS?" */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Clock className="w-24 h-24 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-950 text-amber-400 text-xs font-bold border border-amber-800">
                2
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                When Could It Become Dangerous?
              </h3>
            </div>

            {/* Estimated Spoilage Time Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Estimated Time Until Spoilage Risk
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                {prediction.riskClassification === 'CRITICAL' ? (
                  <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                    <Flame className="w-4 h-4 text-rose-500" />
                    ⚠️ Critical risk in {prediction.estimatedTimeUntilSpoilageSeconds ? Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60) : 12} minutes
                  </span>
                ) : prediction.riskClassification === 'WARNING' ? (
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    ⚠️ Potential excursion risk in ~42 minutes
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    🟢 No spoilage predicted under current conditions
                  </span>
                )}
              </div>
            </div>

            {/* Exposure Duration and Predicted Critical Time */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Estimated Exposure</span>
                <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1">
                  <span>🌡️</span>
                  <span>{prediction.estimatedExposureDurationMinutes > 0 ? `${prediction.estimatedExposureDurationMinutes} mins` : '0 min (Safe)'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Predicted Critical Point</span>
                <div className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1">
                  <span>🔴</span>
                  <span>{prediction.predictedSpoilageTime || 'Stable / None'}</span>
                </div>
              </div>
            </div>

            {/* Progressive Early Warning Callout */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
              prediction.riskClassification === 'CRITICAL' ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' :
              prediction.riskClassification === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' :
              'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            }`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Early Warning Analysis:</span>
              </div>
              <p>{prediction.earlyWarningMessage}</p>
            </div>
          </div>
        </div>

        {/* PILLAR 3: "WHAT SHOULD I DO NOW?" */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Wrench className="w-24 h-24 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  🛡️ Recommended Actions
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {recommendations.length} action{recommendations.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Prioritized Recommendation List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {recommendations.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        rec.priority === 'IMMEDIATE'
                          ? 'bg-rose-900/80 text-rose-200 border border-rose-700 animate-pulse'
                          : rec.priority === 'URGENT'
                          ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                          : rec.priority === 'PREVENTIVE'
                          ? 'bg-yellow-900/60 text-yellow-200 border border-yellow-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {rec.actionType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 leading-snug">
                    {rec.title}
                  </p>
                  
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {rec.description}
                  </p>

                  <button
                    id={`btn-exec-${rec.id}`}
                    onClick={() => onOpenCorrectiveActionModal(rec)}
                    className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-xs font-semibold transition"
                  >
                    <span>Execute Action Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[10px] text-slate-400 italic">
              *Guidance provided for operational containment. Final clinical release subject to SOP.
            </div>
          </div>
        </div>

      </div>

      {/* REAL-TIME TELEMETRY CHARTS & BATCH MONITORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-time SHT33 Temperature & Humidity Trend */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live SHT33 Thermal Excursion Stream</span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous 5-second telemetry sampling with threshold guardbands
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Temp (°C)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Humidity (%)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-3 h-0.5 bg-emerald-500/60 inline-block" /> Safe Ceiling ({activeBatch.maxTemp}°C)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                />
                <ReferenceLine y={activeBatch.maxTemp} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Max ${activeBatch.maxTemp}°C`, fill: '#ef4444', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={activeBatch.minTemp} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: `Min ${activeBatch.minTemp}°C`, fill: '#3b82f6', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={activeBatch.idealTemp} stroke="#10b981" strokeDasharray="2 2" />
                
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#22d3ee' }}
                  activeDot={{ r: 5, fill: '#38bdf8' }}
                  name="Temp (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  name="Humidity (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Monitored Vaccine Batches Quick Summary */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>Monitored Batches</span>
              </h3>
              <button
                onClick={() => onNavigateToTab('batches')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2.5">
              {allBatches.map((b) => {
                const isSelected = b.id === activeBatch.id;
                const statusBadge = 
                  b.currentStatus === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                  b.currentStatus === 'EARLY_WARNING' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                  b.currentStatus === 'QUARANTINED' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                  'bg-emerald-950 text-emerald-300 border-emerald-800';

                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBatch(b.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-850 border-cyan-600/80 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-white truncate">
                        {b.vaccineName}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusBadge}`}>
                        {b.currentStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{b.quantity.toLocaleString()} doses</span>
                      <span className="font-mono text-slate-300">{b.storageUnitName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Bio-Assets at Risk:</span>
            <span className="font-bold text-white font-mono">
              ${allBatches.reduce((acc, b) => acc + (b.quantity * b.unitCost), 0).toLocaleString()} USD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
