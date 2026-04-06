import { LAMPORTS_PER_SOL, MAX_OVERRIDE_FEE_RATIO } from './constants.js';
import { calculateLockedStake, clampProblemIndex } from './problem-index.js';

export const METERED_GRACE_PERIOD_SECONDS = 5;
export const METERED_REFERENCE_PERIOD_SECONDS = 60 * 60;
export const METERED_NOTIFICATION_INTERVAL_SECONDS = 30;

export function calculateMeteredViolationRate(problemIndex, lockedStakeLamports) {
  const normalizedProblemIndex = clampProblemIndex(problemIndex);
  const resolvedLockedStakeLamports =
    lockedStakeLamports != null
      ? Math.max(0, Math.round(Number(lockedStakeLamports) || 0))
      : calculateLockedStake(normalizedProblemIndex);
  const maxFeeLamports = Math.round(resolvedLockedStakeLamports * MAX_OVERRIDE_FEE_RATIO);
  const ratePerSecondLamports =
    METERED_REFERENCE_PERIOD_SECONDS > 0
      ? Math.max(0, Math.round(maxFeeLamports / METERED_REFERENCE_PERIOD_SECONDS))
      : 0;

  return {
    problemIndex: normalizedProblemIndex,
    lockedStakeLamports: resolvedLockedStakeLamports,
    maxFeeLamports,
    ratePerSecondLamports,
    referencePeriodSeconds: METERED_REFERENCE_PERIOD_SECONDS
  };
}

export function calculateMeteredViolationAccrual(ratePerSecondLamports, elapsedSeconds, maxFeeLamports) {
  const normalizedRatePerSecondLamports = Math.max(0, Math.round(Number(ratePerSecondLamports) || 0));
  const normalizedElapsedSeconds = Math.max(0, Number(elapsedSeconds) || 0);
  const normalizedMaxFeeLamports = Math.max(0, Math.round(Number(maxFeeLamports) || 0));
  const accruedLamports = Math.round(normalizedRatePerSecondLamports * normalizedElapsedSeconds);

  return Math.min(normalizedMaxFeeLamports, accruedLamports);
}

export function formatMeteredViolationRate(ratePerSecondLamports) {
  const normalizedRatePerSecondLamports = Math.max(0, Math.round(Number(ratePerSecondLamports) || 0));
  const solPerHour = (normalizedRatePerSecondLamports * 60 * 60) / LAMPORTS_PER_SOL;
  return `${solPerHour.toFixed(4)} SOL/hr`;
}
