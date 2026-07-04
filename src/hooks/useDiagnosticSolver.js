import { useState, useEffect, useMemo, useRef } from 'react';
import { CLINICAL_THRESHOLDS } from '../utils/constants';

/**
 * useDiagnosticSolver
 * Upgraded with Predictive Trend Analytics.
 * It now monitors history to detect rising/falling trends in vitals.
 */
const toRoundedOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
};

export const useDiagnosticSolver = (streamData) => {
  const [clinicalState, setClinicalState] = useState({
    status: 'unknown',
    diagnosis: 'Awaiting signal',
    severity: 0,
    trend: 'stable' // 'rising', 'falling', 'stable'
  });

  const hrHistory = useRef([]);

  // Derived clinical metrics — a field the source data doesn't actually have
  // stays null (rendered as "--" by callers), never a made-up placeholder
  // number. Confidently showing e.g. "72 bpm" when nothing was measured
  // would be indistinguishable from a real reading to whoever is watching.
  const metrics = useMemo(() => {
    if (!streamData) return null;

    const currentHR = toRoundedOrNull(streamData.heart_rate);
    if (currentHR != null) {
      // Update HR History for trend analysis (keep last 10 samples)
      hrHistory.current.push(currentHR);
      if (hrHistory.current.length > 10) hrHistory.current.shift();
    }

    const confidenceRaw = Number(streamData.ai_confidence);
    return {
      hr: currentHR,
      qtc: toRoundedOrNull(streamData.qtc),
      pr: toRoundedOrNull(streamData.pr_interval),
      qrs: toRoundedOrNull(streamData.qrs_duration),
      confidence: Number.isFinite(confidenceRaw) ? (confidenceRaw * 100).toFixed(2) : null,
    };
  }, [streamData]);

  // Clinical Logic Engine + Trend Analysis
  useEffect(() => {
    if (!metrics) return;

    // No real HR yet (device just connected, or between measurement cycles)
    // -- say so rather than defaulting to "normal", which would read as a
    // clean bill of health nobody actually checked.
    if (metrics.hr == null) {
      setClinicalState({ status: 'unknown', diagnosis: 'Awaiting signal', severity: 0, trend: 'stable' });
      return;
    }

    let newStatus = 'normal';
    let newDiag = 'Vitals within configured ranges';
    let newSeverity = 0;
    let newTrend = 'stable';

    const { HEART_RATE, QTC_INTERVAL, QRS_DURATION } = CLINICAL_THRESHOLDS;

    // 1. Threshold Checks
    if ((metrics.qtc != null && metrics.qtc > QTC_INTERVAL.NORMAL_MAX) ||
        metrics.hr > HEART_RATE.TACHYCARDIA ||
        metrics.hr < HEART_RATE.BRADYCARDIA) {
      newStatus = 'abnormal';
      newDiag = [
        metrics.hr > HEART_RATE.TACHYCARDIA || metrics.hr < HEART_RATE.BRADYCARDIA
          ? `HR outside ${HEART_RATE.BRADYCARDIA}-${HEART_RATE.TACHYCARDIA} bpm range`
          : null,
        metrics.qtc != null && metrics.qtc > QTC_INTERVAL.NORMAL_MAX
          ? `QTc above ${QTC_INTERVAL.NORMAL_MAX} ms threshold`
          : null,
      ].filter(Boolean).join(' + ');
      newSeverity = 1;
    }

    if (metrics.qrs != null && metrics.qrs > QRS_DURATION.NORMAL_MAX) {
      newStatus = 'critical';
      newDiag = `QRS above ${QRS_DURATION.NORMAL_MAX} ms threshold`;
      newSeverity = 2;
    }

    // 2. Trend Analysis (Predictive)
    if (hrHistory.current.length >= 5) {
        const firstHalf = hrHistory.current.slice(0, 3).reduce((a,b) => a+b, 0) / 3;
        const lastHalf = hrHistory.current.slice(-3).reduce((a,b) => a+b, 0) / 3;
        
        if (lastHalf > firstHalf + 2) newTrend = 'rising';
        else if (lastHalf < firstHalf - 2) newTrend = 'falling';
    }

    setClinicalState({
      status: newStatus,
      diagnosis: newDiag,
      severity: newSeverity,
      trend: newTrend
    });
  }, [metrics]);

  return {
    metrics,
    clinicalState,
    isNormal: clinicalState.status === 'normal',
    isCritical: clinicalState.status === 'critical',
    trend: clinicalState.trend
  };
};
