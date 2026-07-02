import { calculateOverrideFee, formatFeeSol, formatRemainingDuration } from "@saintrocky/fuckyoupayme";

export function createNowSnapshot() {
  return new Date();
}

export function buildLivePendingAction(action, now) {
  if (action.actionKind === "scheduled_edit") {
    return {
      ...action,
      currentFeeLamports: 0,
      currentFeeSol: Number(action.staticFeeSol || 0),
      isFree: !action.paymentRequired,
      remainingLabel: action.effectiveAt ? formatRemainingDuration(action.effectiveAt, now) : "0m"
    };
  }

  const feeQuote = calculateOverrideFee({
    problemIndex: action.problemIndex,
    lockedStakeLamports: action.lockedStakeLamports,
    requestedAt: action.requestedAt,
    now
  });

  return {
    ...action,
    currentFeeLamports: feeQuote.feeLamports,
    currentFeeSol: feeQuote.feeSol,
    isFree: feeQuote.isFree,
    freeAt: feeQuote.freeAt,
    remainingLabel: formatRemainingDuration(feeQuote.freeAt, now)
  };
}

export function formatPendingActionFeeLabel(action) {
  if (action.actionKind === "scheduled_edit") {
    if (!action.paymentRequired) return "Free";
    return `${Number(action.staticFeeSol || 0).toFixed(4)} SOL`;
  }

  return action.isFree ? "Free" : `${formatFeeSol(action.currentFeeLamports)} SOL`;
}

export function formatPendingActionCountdownLabel(action) {
  if (action.actionKind === "scheduled_edit") {
    return `Applies in ${action.remainingLabel}`;
  }

  return action.isFree ? "Ready to confirm for free" : `Free in ${action.remainingLabel}`;
}

export function canConfirmPendingAction(action) {
  return action.actionKind === "override" || action.actionKind === "deactivation";
}

export function canCancelPendingAction(action) {
  return action.actionKind === "override" || action.actionKind === "deactivation";
}

export function formatPendingActionsTotalFee(totalFeeLamports) {
  return `${formatFeeSol(totalFeeLamports)} SOL`;
}
