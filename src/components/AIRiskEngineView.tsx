import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  HelpCircle, 
  Flame, 
  CheckCircle2, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { VaccineBatch, AIRiskPrediction, TelemetryReading } from '../types';

interface AIRiskEngineViewProps {
  batch: VaccineBatch;
  prediction: AIRiskPrediction;
  latestTelemetry: TelemetryReading | null;
}

export const AIRiskEngineView: React.FC<AIRiskEngineViewProps> = ({
  batch,
  prediction,
  latestTelemetry,
}) => {
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isLoadingDeepAi, setIsLoadingDeepAi] = useState<boolean>(false);

  const fetchGeminiDeepAnalysis = async () => {
    setIsLoadingDeepAi(true);
    try {
      const res = await fetch('/api/ai/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id }),
      });
      const data = await res.json();
      if (data.analysis) {
        setDeepAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to run Gemini AI analysis:', err);
    } finally {
      setIsLoadingDeepAi(false);
    }
  };

  const currentTemp = latestTelemetry ? latestTelemetry.temperature : batch.idealTemp;
  const isHighExcursion = currentTemp > batch.maxTemp;
  const isLowExcursion = currentTemp < batch.minTemp;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  ECHELON Predictive Spoilage Engine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Kinetic Thermostability Model
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-0.5">
                AI Risk Assessment & Thermal Degradation Intelligence
              </h1>
            </div>
          </div>

          <button
            id="btn-run-gemini-ai"
            onClick={fetchGeminiDeepAnalysis}
            disabled={isLoadingDeepAi}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 transition disabled:opacity-50"
          >
            {isLoadingDeepAi ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isLoadingDeepAi ? 'Consulting Gemini Pharmacist...' : 'Run Deep Gemini Clinical Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Explainable Factors vs Mathematical Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: EXPLAINABLE AI CARD (Why is the risk increasing?) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Why is the Risk Increasing?
              </h3>
            </div>
            <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg uppercase ${
              prediction.riskClassification === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
              prediction.riskClassification === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              Risk: {prediction.riskScore} / 100 [{prediction.riskClassification}]
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            ECHELON provides transparent, explainable reasoning for every risk prediction to enable high-confidence clinical decision-making.
          </p>

          <div className="space-y-3">
            {prediction.explainabilityFactors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                <span className="leading-relaxed font-medium">{factor}</span>
              </div>
            ))}
          </div>

          {/* Real-time Degradation Breakdown Strip */}
          <div className="mt-5 grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Thermal Drift</span>
              <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                {prediction.rateOfChangeCPerMin > 0 ? `+${prediction.rateOfChangeCPerMin}` : prediction.rateOfChangeCPerMin} °C/min
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Excursion Duration</span>
              <div className="text-sm font-bold font-mono text-slate-100 mt-0.5">
                {prediction.estimatedExposureDurationMinutes} mins
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Excursions Count</span>
              <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                {prediction.repeatedExcursionsCount} total
              </div>
            </div>
          </div>
        </div>

        {/* Right: KINETIC THERMAL BUDGET & SPOILAGE FORMULA */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Kinetic Degradation & Spoilage Estimation
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <span>1. Thermal Rate Vector (dT/dt)</span>
                </div>
                <p className="text-slate-400">
                  Calculated using a moving linear regression window over consecutive SHT33 sensor telemetry points:
                </p>
                <div className="mt-2 font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  dT/dt = (T_now - T_prev) / Δt = {prediction.rateOfChangeCPerMin} °C/min
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <span>2. Time Remaining Until Irreversible Degradation</span>
                </div>
                <p className="text-slate-400">
                  Integrates current temperature, slope, and batch maximum allowable excursion tolerance ({batch.criticalExcursionMinutes} min threshold at &gt;{batch.criticalUpperTemp}°C):
                </p>
                <div className="mt-2 font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  t_critical = min((T_crit - T_curr) / (dT/dt), Budget_rem) = {prediction.estimatedTimeUntilSpoilageSeconds ? `${Math.round(prediction.estimatedTimeUntilSpoilageSeconds / 60)} minutes` : 'Nominal Stability'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200">
            <span className="font-bold">Model Architecture:</span> ECHELON uses a hybrid deterministically grounded Arrhenius kinetic rule engine, structured for transparent on-device edge execution and continuous cloud verification.
          </div>
        </div>

      </div>

      {/* Deep Gemini AI Analysis Section */}
      {deepAnalysis && (
        <div className="rounded-2xl bg-slate-900 border border-cyan-700/60 p-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Gemini 3.7 Clinical Stability Assessment & Synthesis
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Model: Gemini 3.7 Flash
            </span>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {deepAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};
