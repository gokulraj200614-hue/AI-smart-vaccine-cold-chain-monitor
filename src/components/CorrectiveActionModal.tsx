import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Thermometer, 
  User, 
  FileText, 
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  VaccineBatch, 
  PreventiveActionRecommendation, 
  UserProfile, 
  BatchStatus, 
  Alert 
} from '../types';

interface CorrectiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: VaccineBatch;
  currentTemp: number;
  initialRecommendation?: PreventiveActionRecommendation;
  currentUser: UserProfile;
  activeAlert?: Alert | null;
  onSubmitAction: (actionData: {
    batchId: string;
    alertId?: string;
    actionType: string;
    notes: string;
    performedBy: string;
    newStatus: BatchStatus;
    targetTemp: number;
  }) => void;
}

export const CorrectiveActionModal: React.FC<CorrectiveActionModalProps> = ({
  isOpen,
  onClose,
  batch,
  currentTemp,
  initialRecommendation,
  currentUser,
  activeAlert,
  onSubmitAction,
}) => {
  const [actionType, setActionType] = useState<string>(
    initialRecommendation?.actionType || 'TRANSFER_STORAGE'
  );
  const [notes, setNotes] = useState<string>(
    initialRecommendation ? `Executing ${initialRecommendation.title}. ${initialRecommendation.description}` : ''
  );
  const [performedBy, setPerformedBy] = useState<string>(currentUser.name);
  const [newStatus, setNewStatus] = useState<BatchStatus>('UNDER_ASSESSMENT');
  const [targetTemp, setTargetTemp] = useState<number>(batch.idealTemp);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmitAction({
      batchId: batch.id,
      alertId: activeAlert?.id,
      actionType,
      notes,
      performedBy,
      newStatus,
      targetTemp: Number(targetTemp),
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Log Corrective Action & Risk Mitigation SOP
              </h2>
              <span className="text-xs text-slate-400">
                Batch: {batch.vaccineName} ({batch.id})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Current Excursion State Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-slate-400 font-medium">Excursion Temp</span>
              <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {currentTemp.toFixed(1)}°C
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Safe Boundary</span>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                {batch.minTemp}–{batch.maxTemp}°C
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Batch Doses</span>
              <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                {batch.quantity.toLocaleString()} doses
              </div>
            </div>
          </div>

          {/* Action Type Selection */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Select SOP Corrective Action:
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="TRANSFER_STORAGE">Transfer Batch to Backup Cold-Storage Unit</option>
              <option value="CHECK_SEAL_AND_DOOR">Check Refrigerator Door Magnetic Gaskets & Seal</option>
              <option value="ACTIVATE_BACKUP_COOLING">Engage Auxiliary Backup Cooling / Power Generator</option>
              <option value="ADJUST_THERMOSTAT">Recalibrate Digital Thermostat & Setpoint</option>
              <option value="INSPECT_FREEZING">Inspect for Sub-Zero Freeze & Reposition away from Evaporator</option>
              <option value="REPLACE_COOLANT_PACKS">Replace Phase-Change Coolant Packs (Transport)</option>
              <option value="RECORD_EXCURSION_SOP">Execute Full WHO/CDC Excursion Quarantine Protocol</option>
              <option value="CONTACT_SUPERVISOR">Escalate to Quality Assurance / Logistics Lead</option>
            </select>
          </div>

          {/* Action Notes / SOP Documentation */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Clinical / Engineering Intervention Notes:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe physical actions taken (e.g., moved batch to Cold Vault #2, inspected door latch, re-sealed gasket)..."
              className="w-full bg-slate-850 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Responsible User */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                Responsible Operator / Clinician:
              </label>
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-2">
                <User className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Target Rechecked Temperature */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5">
                Rechecked Temperature After Action (°C):
              </label>
              <div className="flex items-center gap-2 bg-slate-850 border border-slate-700 rounded-xl px-3 py-2">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  step="0.1"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(Number(e.target.value))}
                  className="bg-transparent text-white w-full focus:outline-none font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Updated Batch Safety Status */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Post-Intervention Batch Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'UNDER_ASSESSMENT', label: 'Under Assessment' },
                { id: 'QUARANTINED', label: 'Quarantined for Testing' },
                { id: 'STABILIZED', label: 'Safe / Stabilized' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setNewStatus(st.id as BatchStatus)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                    newStatus === st.id
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Regulatory Requirement:</span> Logging this action will recalculate the real-time AI risk score and create an immutable audit record in the compliance ledger.
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-cyan-950/40 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Action & Reassess Risk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
