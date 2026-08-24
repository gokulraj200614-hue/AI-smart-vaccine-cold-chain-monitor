import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  FileSearch, 
  Flame, 
  ShieldAlert,
  Volume2,
  VolumeX
} from 'lucide-react';
import { VaccineBatch, AIRiskPrediction, Alert, TelemetryReading } from '../types';
import { formatSeconds } from '../utils/riskEngine';

interface InteractiveAlertBannerProps {
  batch: VaccineBatch;
  prediction: AIRiskPrediction;
  latestTelemetry: TelemetryReading | null;
  activeAlert: Alert | null;
  onAcknowledgeAlert: (alertId: string) => void;
  onOpenCorrectiveAction: () => void;
  onViewBatchHistory: () => void;
}

export const InteractiveAlertBanner: React.FC<InteractiveAlertBannerProps> = ({
  batch,
  prediction,
  latestTelemetry,
  activeAlert,
  onAcknowledgeAlert,
  onOpenCorrectiveAction,
  onViewBatchHistory,
}) => {
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    prediction.estimatedTimeUntilSpoilageSeconds || 840
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // Sync and tick countdown timer
  useEffect(() => {
    if (prediction.estimatedTimeUntilSpoilageSeconds !== null) {
      setCountdownSeconds(prediction.estimatedTimeUntilSpoilageSeconds);
    }
  }, [prediction.estimatedTimeUntilSpoilageSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isCritical = prediction.riskClassification === 'CRITICAL';
  const isWarning = prediction.riskClassification === 'WARNING';
  const currentTemp = latestTelemetry ? latestTelemetry.temperature : batch.idealTemp;

  if (!isCritical && !isWarning) {
    return null;
  }

  return (
    <div
      id="interactive-alert-banner"
      className={`mb-6 rounded-2xl border transition-all shadow-xl overflow-hidden ${
        isCritical
          ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 border-rose-600/80 shadow-rose-950/40 animate-critical-glow'
          : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 border-amber-500/70 shadow-amber-950/30'
      }`}
    >
      <div className="p-4 sm:p-6">
        {/* Header Alert Title & Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                isCritical
                  ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/50'
                  : 'bg-amber-500 text-slate-950 shadow-amber-500/40'
              }`}
            >
              {isCritical ? <ShieldAlert className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                    isCritical ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {isCritical ? '🔴 CRITICAL SPOILAGE RISK' : '🟡 TEMPERATURE EXCURSION WARNING'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Unit: {batch.storageUnitName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {batch.vaccineName} ({batch.id})
              </h2>
            </div>
          </div>

          {/* Dynamic Visual Spoilage Countdown */}
          <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl">
            <Clock className={`w-5 h-5 ${isCritical ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {countdownSeconds > 0 ? 'Estimated Time to Critical Exposure' : 'Threshold Status'}
              </div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  countdownSeconds === 0
                    ? 'text-rose-500 animate-pulse'
                    : isCritical
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {countdownSeconds > 0 ? (
                  `⏱️ ${formatSeconds(countdownSeconds)}`
                ) : (
                  '🔴 CRITICAL EXPOSURE THRESHOLD REACHED'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Real-Time Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Current Temperature</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-bold font-mono ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                {currentTemp.toFixed(1)}°C
              </span>
              <span className="text-xs text-slate-400">
                (Safe: {batch.minTemp}–{batch.maxTemp}°C)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Unsafe Exposure</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              {prediction.estimatedExposureDurationMinutes} mins
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">AI Risk Score</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-bold font-mono ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                {prediction.riskScore}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Predicted Critical Point</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {prediction.predictedSpoilageTime || 'In ~14 mins'}
            </div>
          </div>
        </div>

        {/* Recommended Immediate Action Box */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Recommended Immediate Action:
              </span>
              <p className="text-sm font-medium text-slate-200 mt-0.5">
                {isCritical
                  ? `Transfer all ${batch.quantity.toLocaleString()} doses to an approved backup temperature-controlled unit immediately and initiate excursion SOP.`
                  : `Verify refrigerator door gasket seal, check cooling air circulation, and prepare auxiliary cold room if climb continues.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {activeAlert && !activeAlert.acknowledged && (
              <button
                id="btn-ack-alert-banner"
                onClick={() => onAcknowledgeAlert(activeAlert.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ACKNOWLEDGE ALERT</span>
              </button>
            )}

            <button
              id="btn-log-action-banner"
              onClick={onOpenCorrectiveAction}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-900/40 transition"
            >
              <Wrench className="w-4 h-4" />
              <span>LOG CORRECTIVE ACTION</span>
            </button>

            <button
              id="btn-view-history-banner"
              onClick={onViewBatchHistory}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-medium text-xs transition"
            >
              <FileSearch className="w-4 h-4" />
              <span>VIEW BATCH HISTORY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
