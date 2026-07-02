const OVERRIDE_DECAY_WINDOW_MS = 24 * 60 * 60 * 1000;

function coerceIsoTimestamp(value) {
  if (!value) return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  return timestamp.toISOString();
}

function buildFallbackFreeAt(requestedAt) {
  const requestedTimestamp = requestedAt ? new Date(requestedAt).getTime() : Number.NaN;
  if (Number.isNaN(requestedTimestamp)) return null;
  return new Date(requestedTimestamp + OVERRIDE_DECAY_WINDOW_MS).toISOString();
}

function getRuleTitle(rule = {}) {
  return rule.title || rule.summary || rule.compiledRule?.summary || rule.ruleId || 'Rule';
}

function getRuleSummary(rule = {}) {
  return rule.summary || rule.compiledRule?.summary || rule.title || 'Pending rule action';
}

function resolveProblemIndex(rule = {}, payload = {}) {
  return payload.problemIndex ?? rule.pendingEdit?.problemIndex ?? rule.problemIndex ?? 50;
}

function resolveLockedStakeLamports(rule = {}, payload = {}) {
  return payload.lockedStakeLamports ?? rule.pendingEdit?.lockedStakeLamports ?? rule.lockedStakeLamports ?? 0;
}

function buildOverrideAction(rule, request) {
  const requestedAt = coerceIsoTimestamp(request?.requestedAt);
  const freeAt =
    coerceIsoTimestamp(request?.currentQuote?.freeAt) ||
    coerceIsoTimestamp(request?.freeAt) ||
    buildFallbackFreeAt(requestedAt);

  return {
    actionId: request.requestId,
    requestId: request.requestId,
    actionKind: 'override',
    actionLabel: 'Override rule',
    ruleId: rule.ruleId,
    ruleTitle: getRuleTitle(rule),
    ruleSummary: getRuleSummary(rule),
    problemIndex: resolveProblemIndex(rule, request),
    lockedStakeLamports: resolveLockedStakeLamports(rule, request),
    requestedAt,
    freeAt,
    effectiveAt: freeAt,
    targetStatus: null,
    timingOption: null,
    paymentRequired: null,
    staticFeeSol: null
  };
}

function buildDeactivationAction(rule, request) {
  const requestedAt = coerceIsoTimestamp(request?.requestedAt);
  const freeAt =
    coerceIsoTimestamp(request?.currentQuote?.freeAt) ||
    coerceIsoTimestamp(request?.freeAt) ||
    buildFallbackFreeAt(requestedAt);
  const targetStatus = request?.metadata?.targetStatus || 'paused';

  return {
    actionId: request.requestId,
    requestId: request.requestId,
    actionKind: 'deactivation',
    actionLabel: targetStatus === 'archived' ? 'Archive rule' : 'Pause rule',
    ruleId: rule.ruleId,
    ruleTitle: getRuleTitle(rule),
    ruleSummary: getRuleSummary(rule),
    problemIndex: resolveProblemIndex(rule, request),
    lockedStakeLamports: resolveLockedStakeLamports(rule, request),
    requestedAt,
    freeAt,
    effectiveAt: freeAt,
    targetStatus,
    timingOption: null,
    paymentRequired: null,
    staticFeeSol: null
  };
}

function buildScheduledEditAction(rule, pendingEdit) {
  const requestedAt = coerceIsoTimestamp(pendingEdit?.requestedAt);
  const effectiveAt = coerceIsoTimestamp(pendingEdit?.effectiveAt);

  return {
    actionId: `edit-${rule.ruleId}`,
    requestId: null,
    actionKind: 'scheduled_edit',
    actionLabel: 'Scheduled edit',
    ruleId: rule.ruleId,
    ruleTitle: getRuleTitle(rule),
    ruleSummary: pendingEdit?.summary || getRuleSummary(rule),
    problemIndex: resolveProblemIndex(rule, pendingEdit),
    lockedStakeLamports: resolveLockedStakeLamports(rule, pendingEdit),
    requestedAt,
    freeAt: effectiveAt,
    effectiveAt,
    targetStatus: null,
    timingOption: pendingEdit?.timingOption || null,
    paymentRequired: Boolean(pendingEdit?.paymentRequired),
    staticFeeSol: Number(pendingEdit?.feeSol || 0)
  };
}

function resolveSortTimestamp(action) {
  return action.freeAt || action.effectiveAt || action.requestedAt || '';
}

export function extractPendingActions(rules = []) {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  return rules
    .flatMap((rule) => {
      if (!rule?.ruleId) return [];

      const nextActions = [];
      const overrideRequest = rule.pendingRuleChangeRequests?.override;
      const deactivationRequest = rule.pendingRuleChangeRequests?.deactivation;

      if (overrideRequest?.requestId) {
        nextActions.push(buildOverrideAction(rule, overrideRequest));
      }

      if (deactivationRequest?.requestId) {
        nextActions.push(buildDeactivationAction(rule, deactivationRequest));
      }

      if (rule.pendingEdit?.effectiveAt) {
        nextActions.push(buildScheduledEditAction(rule, rule.pendingEdit));
      }

      return nextActions;
    })
    .sort((leftAction, rightAction) => {
      const leftTime = new Date(resolveSortTimestamp(leftAction)).getTime();
      const rightTime = new Date(resolveSortTimestamp(rightAction)).getTime();

      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
      if (Number.isNaN(leftTime)) return 1;
      if (Number.isNaN(rightTime)) return -1;
      return leftTime - rightTime;
    });
}
