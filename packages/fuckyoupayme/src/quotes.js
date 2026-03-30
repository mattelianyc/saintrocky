import {
  FREE_OVERRIDE_AFTER_HOURS,
  LAMPORTS_PER_SOL,
  MAX_OVERRIDE_FEE_RATIO,
  OVERRIDE_DECAY_RATE,
  WITHDRAWAL_COOLDOWN_HOURS
} from './constants.js';
import {
  calculateLockedStake,
  clampProblemIndex,
  getProblemIndexLabel
} from './problem-index.js';

export function calculateOverrideDecayFactor(elapsedHours) {
  const normalizedElapsedHours = Math.max(0, Number(elapsedHours) || 0);
  if (normalizedElapsedHours >= FREE_OVERRIDE_AFTER_HOURS) {
    return 0;
  }

  const numerator =
    Math.exp((-OVERRIDE_DECAY_RATE * normalizedElapsedHours) / FREE_OVERRIDE_AFTER_HOURS) -
    Math.exp(-OVERRIDE_DECAY_RATE);
  const denominator = 1 - Math.exp(-OVERRIDE_DECAY_RATE);

  return Math.max(0, Math.min(1, numerator / denominator));
}

export function calculateOverrideFee({
  problemIndex,
  lockedStakeLamports,
  requestedAt,
  now = new Date()
} = {}) {
  const normalizedProblemIndex = clampProblemIndex(problemIndex);
  const resolvedLockedStakeLamports =
    lockedStakeLamports != null
      ? Math.max(0, Math.round(Number(lockedStakeLamports) || 0))
      : calculateLockedStake(normalizedProblemIndex);

  const requestedAtDate = requestedAt ? new Date(requestedAt) : new Date();
  const nowDate = now instanceof Date ? now : new Date(now);
  const elapsedMs = Math.max(0, nowDate.getTime() - requestedAtDate.getTime());
  const elapsedHours = elapsedMs / (60 * 60 * 1000);
  const decayFactor = calculateOverrideDecayFactor(elapsedHours);
  const maxFeeLamports = Math.round(resolvedLockedStakeLamports * MAX_OVERRIDE_FEE_RATIO);
  const feeLamports = Math.round(maxFeeLamports * decayFactor);
  const freeAtDate = new Date(
    requestedAtDate.getTime() + FREE_OVERRIDE_AFTER_HOURS * 60 * 60 * 1000
  );

  return {
    problemIndex: normalizedProblemIndex,
    problemIndexLabel: getProblemIndexLabel(normalizedProblemIndex),
    lockedStakeLamports: resolvedLockedStakeLamports,
    maxFeeLamports,
    feeLamports,
    feeSol: feeLamports / LAMPORTS_PER_SOL,
    decayFactor,
    elapsedHours,
    requestedAt: requestedAtDate.toISOString(),
    freeAt: freeAtDate.toISOString(),
    remainingHours: Math.max(0, FREE_OVERRIDE_AFTER_HOURS - elapsedHours),
    isFree: feeLamports === 0
  };
}

export function getWithdrawalCooldownEndsAt(withdrawnAt) {
  const withdrawnAtDate = withdrawnAt ? new Date(withdrawnAt) : new Date();
  return new Date(
    withdrawnAtDate.getTime() + WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000
  );
}
