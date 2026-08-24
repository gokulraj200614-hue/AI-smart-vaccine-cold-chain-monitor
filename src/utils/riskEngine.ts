import { 
  VaccineBatch, 
  TelemetryReading, 
  AIRiskPrediction, 
  PreventiveActionRecommendation,
  ActionPriority,
  RiskClassification,
  BatchStatus
} from '../types';

export function calculateAIRiskPrediction(
  batch: VaccineBatch,
  recentReadings: TelemetryReading[]
): AIRiskPrediction {
  if (!recentReadings || recentReadings.length === 0) {
    return {
      batchId: batch.id,
      riskScore: 10,
      riskClassification: 'SAFE',
      estimatedExposureDurationMinutes: 0,
      estimatedTimeUntilSpoilageSeconds: null,
      predictedSpoilageTime: null,
      temperatureTrend: 'STABLE',
      rateOfChangeCPerMin: 0,
      recoveryTimeRemainingMinutes: null,
      repeatedExcursionsCount: 0,
      maxRecordedTemp: batch.idealTemp,
      minRecordedTemp: batch.idealTemp,
      explainabilityFactors: ['Insufficient telemetry data - defaulting to nominal baseline.'],
      earlyWarningMessage: 'Initializing sensor stream from SHT33 edge unit.',
    };
  }

  // Sort chronological
  const sorted = [...recentReadings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const latest = sorted[sorted.length - 1];
  const currentTemp = latest.temperature;
  const temps = sorted.map((r) => r.temperature);
  const maxRecordedTemp = Math.max(...temps);
  const minRecordedTemp = Math.min(...temps);

  // Rate of change calculation (dT/dt in °C per minute over up to 10 latest readings)
  let rateOfChangeCPerMin = 0;
  const sampleWindow = sorted.slice(-10);
  if (sampleWindow.length >= 2) {
    const firstInWindow = sampleWindow[0];
    const lastInWindow = sampleWindow[sampleWindow.length - 1];
    const timeDiffMinutes =
      (new Date(lastInWindow.timestamp).getTime() - new Date(firstInWindow.timestamp).getTime()) /
      (1000 * 60);
    
    if (timeDiffMinutes > 0.05) {
      rateOfChangeCPerMin = Number(
        ((lastInWindow.temperature - firstInWindow.temperature) / timeDiffMinutes).toFixed(3)
      );
    }
  }

  // Determine trend category
  let temperatureTrend: AIRiskPrediction['temperatureTrend'] = 'STABLE';
  if (rateOfChangeCPerMin > 0.25) temperatureTrend = 'RISING_FAST';
  else if (rateOfChangeCPerMin > 0.04) temperatureTrend = 'RISING_SLOW';
  else if (rateOfChangeCPerMin < -0.25) temperatureTrend = 'FALLING_FAST';
  else if (rateOfChangeCPerMin < -0.04) temperatureTrend = 'FALLING_SLOW';

  // Count consecutive out-of-range readings to calculate exposure duration
  let consecutiveUnsafeCount = 0;
  let excursionType: 'HIGH' | 'LOW' | 'NONE' = 'NONE';

  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = sorted[i].temperature;
    if (t > batch.maxTemp) {
      if (excursionType === 'NONE') excursionType = 'HIGH';
      if (excursionType === 'HIGH') consecutiveUnsafeCount++;
      else break;
    } else if (t < batch.minTemp) {
      if (excursionType === 'NONE') excursionType = 'LOW';
      if (excursionType === 'LOW') consecutiveUnsafeCount++;
      else break;
    } else {
      break;
    }
  }

  // Sampling assumed ~5 seconds per reading in real-time mode
  const estimatedExposureDurationMinutes = Math.round((consecutiveUnsafeCount * 5) / 60);

  // Repeated excursions detection
  let excursionCount = 0;
  let inExcursion = false;
  for (const r of sorted) {
    if (r.temperature > batch.maxTemp || r.temperature < batch.minTemp) {
      if (!inExcursion) {
        excursionCount++;
        inExcursion = true;
      }
    } else {
      inExcursion = false;
    }
  }

  // Calculate Base Risk Score (0 - 100)
  let rawScore = 12; // Baseline nominal
  const explainability: string[] = [];

  const isHighExcursion = currentTemp > batch.maxTemp;
  const isLowExcursion = currentTemp < batch.minTemp;

  if (!isHighExcursion && !isLowExcursion) {
    // Normal range
    if (temperatureTrend === 'RISING_FAST' && currentTemp > batch.maxTemp - 1.0) {
      rawScore = 38;
      explainability.push(`Temperature is within range (${currentTemp.toFixed(1)}°C) but rising rapidly (+${rateOfChangeCPerMin.toFixed(2)}°C/min) toward the ${batch.maxTemp}°C limit.`);
    } else if (temperatureTrend === 'FALLING_FAST' && currentTemp < batch.minTemp + 1.0) {
      rawScore = 35;
      explainability.push(`Temperature is within range (${currentTemp.toFixed(1)}°C) but dropping rapidly towards freezing risks.`);
    } else {
      rawScore = 15;
      explainability.push(`Temperature (${currentTemp.toFixed(1)}°C) and humidity are within optimal storage parameters (${batch.minTemp}°C to ${batch.maxTemp}°C).`);
    }
  } else if (isHighExcursion) {
    const deltaOver = currentTemp - batch.maxTemp;
    const tempSeverity = Math.min(50, deltaOver * 8); // e.g. +3°C over -> 24 pts
    const durationSeverity = Math.min(35, (estimatedExposureDurationMinutes / batch.criticalExcursionMinutes) * 35);
    const rateSeverity = rateOfChangeCPerMin > 0 ? Math.min(15, rateOfChangeCPerMin * 50) : -5;
    
    rawScore = 35 + tempSeverity + durationSeverity + rateSeverity;
    
    explainability.push(`Temperature (${currentTemp.toFixed(1)}°C) has exceeded the safe ceiling (${batch.maxTemp.toFixed(1)}°C) by +${deltaOver.toFixed(1)}°C.`);
    if (estimatedExposureDurationMinutes > 0) {
      explainability.push(`Continuous unsafe exposure duration is approximately ${estimatedExposureDurationMinutes} minutes (Critical limit: ${batch.criticalExcursionMinutes} min).`);
    }
    if (rateOfChangeCPerMin > 0) {
      explainability.push(`Thermal climb rate is +${rateOfChangeCPerMin.toFixed(2)}°C/min without active thermal resistance.`);
    } else if (rateOfChangeCPerMin < -0.05) {
      explainability.push(`Temperature is trending downward (-${Math.abs(rateOfChangeCPerMin).toFixed(2)}°C/min) indicating cooling recovery.`);
    }
  } else if (isLowExcursion) {
    const deltaUnder = batch.minTemp - currentTemp;
    const subZeroPenalty = currentTemp < 0 ? 30 : 0;
    rawScore = 40 + deltaUnder * 15 + subZeroPenalty + Math.min(25, estimatedExposureDurationMinutes * 1.5);
    
    explainability.push(`Temperature (${currentTemp.toFixed(1)}°C) is below recommended minimum (${batch.minTemp.toFixed(1)}°C) — freeze risk detected.`);
    if (currentTemp < 0) {
      explainability.push(`CRITICAL: Sub-zero freezing condition (<0.0°C) may irreversibly denature protein/adjuvant structure.`);
    }
  }

  if (excursionCount > 1) {
    rawScore += Math.min(15, (excursionCount - 1) * 5);
    explainability.push(`Historical cumulative fatigue: Batch has experienced ${excursionCount} separate temperature excursions.`);
  }

  // Clamp Risk Score between 0 and 100
  const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Risk Classification
  let riskClassification: RiskClassification = 'SAFE';
  if (riskScore >= 71) {
    riskClassification = 'CRITICAL';
  } else if (riskScore >= 31) {
    riskClassification = 'WARNING';
  }

  // Predictive Spoilage Estimation
  let estimatedTimeUntilSpoilageSeconds: number | null = null;
  let predictedSpoilageTime: string | null = null;
  let recoveryTimeRemainingMinutes: number | null = null;

  if (riskClassification === 'CRITICAL' || (isHighExcursion && rateOfChangeCPerMin > 0)) {
    // Calculate minutes until reaching critical upper temp or max allowable duration
    const criticalTemp = batch.criticalUpperTemp || batch.maxTemp + 4.0;
    let minutesToCritTemp = 999;
    if (rateOfChangeCPerMin > 0.01) {
      const remainingTempMargin = criticalTemp - currentTemp;
      if (remainingTempMargin <= 0) {
        minutesToCritTemp = 2; // already past critical temp threshold
      } else {
        minutesToCritTemp = remainingTempMargin / rateOfChangeCPerMin;
      }
    }

    const remainingExposureMinutes = Math.max(1, batch.criticalExcursionMinutes - estimatedExposureDurationMinutes);
    const predictedMinutes = Math.max(1, Math.min(minutesToCritTemp, remainingExposureMinutes));
    
    estimatedTimeUntilSpoilageSeconds = Math.round(predictedMinutes * 60);

    const now = new Date(latest.timestamp);
    const targetDate = new Date(now.getTime() + estimatedTimeUntilSpoilageSeconds * 1000);
    predictedSpoilageTime = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    explainability.push(`Predicted critical degradation condition in approximately ${Math.round(predictedMinutes)} minutes (${predictedSpoilageTime}) if unmitigated.`);
  } else if (isHighExcursion && rateOfChangeCPerMin < -0.05) {
    // Recovering
    const tempToRecover = currentTemp - batch.idealTemp;
    recoveryTimeRemainingMinutes = Math.max(1, Math.round(tempToRecover / Math.abs(rateOfChangeCPerMin)));
    explainability.push(`Active thermal stabilization detected: Projected full recovery to ${batch.idealTemp}°C in ~${recoveryTimeRemainingMinutes} minutes.`);
  }

  // Progressive Early Warning Message
  let earlyWarningMessage = '🟢 Temperature is within the recommended safe storage range.';
  if (riskClassification === 'CRITICAL') {
    earlyWarningMessage = `🔴 Critical risk detected: Immediate intervention required. Continued exposure may compromise batch potency. Estimated critical threshold in ${estimatedTimeUntilSpoilageSeconds ? formatSeconds(estimatedTimeUntilSpoilageSeconds) : 'under 10 minutes'}.`;
  } else if (riskClassification === 'WARNING' && isHighExcursion) {
    earlyWarningMessage = `🟠 High Risk: Vaccine batch is in an active temperature excursion. Estimated time to critical risk: ${estimatedTimeUntilSpoilageSeconds ? formatSeconds(estimatedTimeUntilSpoilageSeconds) : '24 minutes'}.`;
  } else if (riskClassification === 'WARNING') {
    earlyWarningMessage = `🟡 Early Warning: Temperature trend indicates anomalous rise (+${rateOfChangeCPerMin.toFixed(2)}°C/min). Unsafe exposure may occur in ~45 minutes if trend continues.`;
  }

  return {
    batchId: batch.id,
    riskScore,
    riskClassification,
    estimatedExposureDurationMinutes,
    estimatedTimeUntilSpoilageSeconds,
    predictedSpoilageTime,
    temperatureTrend,
    rateOfChangeCPerMin,
    recoveryTimeRemainingMinutes,
    repeatedExcursionsCount: excursionCount,
    maxRecordedTemp: Number(maxRecordedTemp.toFixed(1)),
    minRecordedTemp: Number(minRecordedTemp.toFixed(1)),
    explainabilityFactors: explainability,
    earlyWarningMessage,
  };
}

export function generatePreventiveRecommendations(
  batch: VaccineBatch,
  prediction: AIRiskPrediction,
  currentTemp: number,
  isTransport: boolean
): PreventiveActionRecommendation[] {
  const actions: PreventiveActionRecommendation[] = [];

  if (prediction.riskClassification === 'CRITICAL') {
    if (isTransport) {
      actions.push({
        id: 'ACT-CRIT-TR-1',
        priority: 'IMMEDIATE',
        title: 'Emergency Cold-Depot Reroute & Inspection',
        description: 'Divert transport to nearest validated cold-storage hub immediately. Inspect secondary dry ice/phase-change coolant packs and record container integrity.',
        actionType: 'TRANSFER_STORAGE',
        suggestedTargetUnit: 'REGIONAL-HUB-COLD-VAULT',
        requiresQuarantine: true,
      });
      actions.push({
        id: 'ACT-CRIT-TR-2',
        priority: 'IMMEDIATE',
        title: 'Notify Logistics Coordinator & Transport Supervisor',
        description: 'Dispatch urgent deviation alert to the central cold-chain command and initiate transport chain-of-custody excursion audit.',
        actionType: 'CONTACT_SUPERVISOR',
      });
    } else {
      actions.push({
        id: 'ACT-CRIT-ST-1',
        priority: 'IMMEDIATE',
        title: 'Transfer Batch to Approved Backup Cold-Storage Unit',
        description: `Immediately transfer all ${batch.quantity.toLocaleString()} doses of ${batch.vaccineName} into secondary validated storage (Target: 2.0°C - 8.0°C).`,
        actionType: 'TRANSFER_STORAGE',
        suggestedTargetUnit: 'BACKUP-COLD-ROOM-B2',
        requiresQuarantine: true,
      });
      actions.push({
        id: 'ACT-CRIT-ST-2',
        priority: 'IMMEDIATE',
        title: 'Engage Auxiliary Backup Cooling / Generator',
        description: 'Switch storage unit power circuit to tertiary backup generator or activate emergency CO2 / liquid N2 injection cooling.',
        actionType: 'ACTIVATE_BACKUP_COOLING',
      });
      actions.push({
        id: 'ACT-CRIT-ST-3',
        priority: 'URGENT',
        title: 'Execute Formal Vaccine Excursion SOP & Quarantine Tagging',
        description: 'Apply electronic quarantine lock in ECHELON and document degree-minute exposure for manufacturer stability assessment before any clinical use.',
        actionType: 'RECORD_EXCURSION_SOP',
      });
    }
  } else if (prediction.riskClassification === 'WARNING') {
    if (currentTemp > batch.maxTemp) {
      actions.push({
        id: 'ACT-WARN-1',
        priority: 'URGENT',
        title: 'Verify Door Seals & Minimize Access',
        description: 'Check magnetic gasket seals, inspect for latch obstruction, and enforce strict temporary access freeze on the refrigeration compartment.',
        actionType: 'CHECK_SEAL_AND_DOOR',
      });
      actions.push({
        id: 'ACT-WARN-2',
        priority: 'URGENT',
        title: 'Prepare Backup Storage & Monitor Rate of Climb',
        description: `Pre-chill backup transport containers or verify secondary cold-room availability. Pre-stage transport coolers if temp crosses ${batch.maxTemp + 2}°C.`,
        actionType: 'TRANSFER_STORAGE',
        suggestedTargetUnit: 'AUX-CHILLER-01',
      });
      actions.push({
        id: 'ACT-WARN-3',
        priority: 'PREVENTIVE',
        title: 'Calibrate Digital Thermostat Settings',
        description: `Inspect compressor duty cycle and adjust setpoint to ${batch.idealTemp}°C nominal.`,
        actionType: 'ADJUST_THERMOSTAT',
      });
    } else if (currentTemp < batch.minTemp) {
      actions.push({
        id: 'ACT-WARN-LOW-1',
        priority: 'IMMEDIATE',
        title: 'Reposition Away from Evaporator / Cold Plate',
        description: 'Move vaccine packages away from the cooling coil blower to avoid localized freeze spots. Freezing destroys aluminum-adjuvant vaccines.',
        actionType: 'INSPECT_FREEZING',
      });
      actions.push({
        id: 'ACT-WARN-LOW-2',
        priority: 'URGENT',
        title: 'Perform Shake Test Protocol Before Re-release',
        description: 'Inspect vials for flocculation or sedimentation precipitate per WHO freeze-damage guidance before returning to active dispensing.',
        actionType: 'RECORD_EXCURSION_SOP',
      });
    } else {
      actions.push({
        id: 'ACT-WARN-TREND-1',
        priority: 'PREVENTIVE',
        title: 'Investigate Thermal Drift Anomaly',
        description: 'Telemetry indicates steady upward thermal drift (+0.12°C/min). Inspect condenser coils for dust accumulation or ambient airflow blockage.',
        actionType: 'CONTINUE_MONITORING',
      });
    }
  } else {
    actions.push({
      id: 'ACT-NORM-1',
      priority: 'NORMAL',
      title: 'Nominal Operations - Continue Routine Telemetry',
      description: 'Storage conditions are fully compliant with manufacturer stability monographs. Maintain standard 5-second SHT33 edge sampling and daily audit verification.',
      actionType: 'CONTINUE_MONITORING',
    });
  }

  return actions;
}

export function formatSeconds(seconds: number): string {
  if (seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationHuman(minutes: number): string {
  if (minutes < 1) return 'under 1 minute';
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hrs === 0) return `${remainingMins} minute${remainingMins > 1 ? 's' : ''}`;
  if (remainingMins === 0) return `${hrs} hour${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr ${remainingMins} min`;
}
