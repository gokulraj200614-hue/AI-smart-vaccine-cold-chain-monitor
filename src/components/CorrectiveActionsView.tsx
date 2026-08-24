import React from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  User, 
  TrendingDown, 
  FileCheck, 
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CorrectiveActionLog, VaccineBatch, UserProfile } from '../types';

interface CorrectiveActionsViewProps {
  logs: CorrectiveActionLog[];
  batches: VaccineBatch[];
  currentUser: UserProfile;
  onOpenNewActionModal: () => void;
}

export const CorrectiveActionsView: React.FC<CorrectiveActionsViewProps> = ({
  logs,
  batches,
  currentUser,
  onOpenNewActionModal,
}) => {
  const steps = [
    { step: '1', title: 'Alert Detected', desc: 'Threshold breached' },
    { step: '2', title: 'Review Excursion', desc: 'Verify telemetry & drift' },
    { step: '3', title: 'Risk Assessment', desc: 'Calculate kinetic budget' },
    { step: '4', title: 'Action Protocol', desc: 'Execute recommended SOP' },
    { step: '5', title: 'Record Intervention', desc: 'Document notes & user' },
    { step: '6', title: 'Risk Reassessment', desc: 'Recheck temp & stabilize' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/20">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Closed-Loop Remediation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                GxP Compliance
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Corrective Action & Decision Workflow
            </h1>
          </div>
        </div>

        <button
          id="btn-log-manual-action"
          onClick={onOpenNewActionModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Corrective Action</span>
        </button>
      </div>

      {/* Decision Workflow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Standard Operating Procedure (SOP) Action Lifecycle</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col justify-between"
            >
              <div>
                <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black flex items-center justify-center mb-2">
                  {s.step}
                </div>
                <h4 className="text-xs font-bold text-slate-200">{s.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{s.desc}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historical Corrective Action Logs */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Audit-Verified Corrective Action Logs ({logs.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            Immutable Digital Signature Records
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-200">No Historical Excursions or Corrective Actions Logged</p>
            <p className="text-slate-500 mt-1">All monitored storage units and transport fleets are operating in nominal compliance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const matchedBatch = batches.find((b) => b.id === log.batchId);
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-300 font-mono">{log.batchId}</span>
                      <span className="text-slate-400">({matchedBatch?.vaccineName || 'Vaccine Batch'})</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{new Date(log.actionTime).toLocaleString()}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold font-mono">
                        {log.newStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Action Executed:</span>
                      <p className="font-bold text-slate-200 mt-0.5">{log.actionType.replace(/_/g, ' ')}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">Responsible User:</span>
                      <p className="font-medium text-slate-300 mt-0.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{log.performedBy}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">Risk Impact:</span>
                      <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                        <span>{log.previousRiskScore}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-300">{log.newRiskScore} / 100</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">Rechecked Temp:</span>
                      <p className="font-bold text-slate-100 font-mono mt-0.5">{log.recheckedTemp.toFixed(1)}°C</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-850 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Intervention Notes: </span>
                    {log.notes}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
