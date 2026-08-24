import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  Mail, 
  MessageSquare, 
  CheckCheck,
  Wrench,
  Volume2,
  VolumeX,
  Flame,
  Search,
  Filter
} from 'lucide-react';
import { Alert, UserProfile } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onOpenCorrectiveAction: (alert: Alert) => void;
  currentUser: UserProfile;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onOpenCorrectiveAction,
  currentUser,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [showResolved, setShowResolved] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (!showResolved && a.resolved) return false;
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-500/20">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Active Notification Dispatch Hub
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Multi-Channel Gateway
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Cold-Chain Thermal Excursion Alerts Center
            </h1>
          </div>
        </div>

        {/* Audio Alert Toggle & Stats */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              audioEnabled
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'Klaxon Audio Active' : 'Mute Audio'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-300">Severity:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterSeverity === sev
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-resolved-check"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0 w-4 h-4"
          />
          <label htmlFor="show-resolved-check" className="text-slate-300 font-medium">
            Include Resolved History
          </label>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-200 text-sm">No Active Unresolved Alerts</p>
            <p className="text-slate-500 mt-1">All monitored storage units and transport fleets are operating in safe thermal parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition shadow-lg ${
                  alert.resolved
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : isCritical
                    ? 'bg-slate-900 border-rose-600/80 shadow-rose-950/20'
                    : 'bg-slate-900 border-amber-600/70 shadow-amber-950/20'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                        isCritical
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {alert.batchId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isCritical ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{alert.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    {alert.acknowledged ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                        <CheckCheck className="w-3.5 h-3.5" /> Ack by {alert.acknowledgedBy}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-sans font-bold animate-pulse">
                        Unacknowledged
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-3 text-xs text-slate-300 leading-relaxed">
                  {alert.message}
                </div>

                {/* Real-Time Snapshot Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Trigger Temp</span>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">{alert.currentTemp.toFixed(1)}°C</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Risk Score</span>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">{alert.riskScore} / 100</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Time to Critical</span>
                    <div className="text-sm font-bold text-cyan-300 mt-0.5">{alert.timeToCriticalExposureMinutes} mins</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Channels Dispatched</span>
                    <div className="flex items-center gap-2 text-slate-300 mt-1 font-sans text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" title="Email sent" />
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" title="SMS sent" />
                      <Bell className="w-3.5 h-3.5 text-amber-400" title="Dashboard push" />
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Recommended: </span>
                    {alert.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {!alert.resolved && (
                      <button
                        onClick={() => onOpenCorrectiveAction(alert)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-950/50"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Resolve & Log SOP Action</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
