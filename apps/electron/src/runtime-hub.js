import { randomUUID } from 'node:crypto';

import { isScheduleActive } from '@saintrocky/shared';
import { isKnownBrowserProcess } from '@saintrocky/chain';
import { getScheduleWindowEndTime } from '@saintrocky/enforcement';
import {
  calculateMeteredViolationAccrual,
  calculateMeteredViolationRate,
  FREE_OVERRIDE_AFTER_HOURS,
  formatFeeSol,
  METERED_GRACE_PERIOD_SECONDS,
  METERED_NOTIFICATION_INTERVAL_SECONDS
} from '@saintrocky/fuckyoupayme';

import { findMatchingProcessNames, getFocusedApplicationName, listVisibleProcesses } from './process-observer.js';

const PROCESS_SCAN_INTERVAL_MS = 5_000;

function buildInitialState() {
  return {
    ownerEmail: '',
    monitorStatus: 'idle',
    isArmed: true,
    assignments: [],
    rules: [],
    recentEvents: [],
    pendingViolation: null,
    pendingOverrideRequest: null,
    activeOverrides: {},
    meteredViolation: null,
    extensionSessions: [],
    lastAssignmentSyncAt: null,
    lastProcessScanAt: null,
    visibleProcesses: [],
    focusedApplicationName: '',
    enforcementGap: null,
    chainViolations: [],
    dashboard: null,
    leaderboardSnapshot: null,
    crossSurfaceActivity: [],
    realtimeConnectionState: 'idle',
    preferences: {
      notificationsEnabled: true,
      hideToTrayOnClose: true
    }
  };
}

function toIsoNow() {
  return new Date().toISOString();
}

function buildEventRecord(eventType, assignment, details = {}) {
  return {
    eventId: randomUUID(),
    ruleId: assignment.ruleId,
    eventType,
    occurredAt: toIsoNow(),
    title: assignment.compiledRule?.summary || assignment.ruleId,
    details
  };
}

function buildMonitorStatus(state) {
  if (!state.ownerEmail) return 'disconnected';
  if (state.realtimeConnectionState === 'connecting' || state.realtimeConnectionState === 'error') return 'reconnecting';
  if ((state.pendingViolation || state.meteredViolation) && state.pendingOverrideRequest) return 'overrideCountdown';
  if (state.meteredViolation?.status === 'meter_running') return 'meterRunning';
  if (state.meteredViolation?.status === 'grace_period') return 'gracePeriod';
  if (hasAnyActiveOverride(state)) return 'overrideActive';
  if (state.enforcementGap) return 'enforcementGap';
  if (state.pendingViolation) return 'awaitingBypassDecision';
  if (!state.isArmed) return 'idle';
  return state.assignments.length ? 'armed' : 'idle';
}

function buildSnapshot(state) {
  return { ...state, monitorStatus: buildMonitorStatus(state) };
}

function buildMeteredViolationRecord(rule, assignment, matches) {
  const rate = calculateMeteredViolationRate(rule?.problemIndex ?? 50, rule?.lockedStakeLamports ?? 0);
  const detectedAt = toIsoNow();
  const graceEndsAt = new Date(Date.now() + METERED_GRACE_PERIOD_SECONDS * 1000).toISOString();

  return {
    violationId: randomUUID(),
    ruleId: assignment.ruleId,
    title: assignment.compiledRule?.summary || assignment.ruleId,
    summary: assignment.compiledRule?.enforcement?.userMessage || 'This rule was triggered.',
    detectedAt,
    matchedTargets: matches,
    status: 'grace_period',
    graceEndsAt,
    meterStartedAt: null,
    accruedLamports: 0,
    ratePerSecondLamports: rate.ratePerSecondLamports,
    maxFeeLamports: rate.maxFeeLamports,
    lockedStakeLamports: rate.lockedStakeLamports,
    problemIndex: rule?.problemIndex ?? 50,
    lastNotificationAt: null
  };
}

function getMeteredViolationAccruedLamports(meteredViolation, now = new Date()) {
  if (!meteredViolation?.meterStartedAt) {
    return 0;
  }

  const startedAt = new Date(meteredViolation.meterStartedAt);
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(nowDate.getTime())) {
    return meteredViolation?.accruedLamports || 0;
  }

  const elapsedSeconds = Math.max(0, (nowDate.getTime() - startedAt.getTime()) / 1000);
  return calculateMeteredViolationAccrual(
    meteredViolation.ratePerSecondLamports,
    elapsedSeconds,
    meteredViolation.maxFeeLamports
  );
}

function getFutureIsoTimestamp(value) {
  const timestamp = new Date(value || '');
  if (Number.isNaN(timestamp.getTime()) || timestamp.getTime() <= Date.now()) {
    return null;
  }

  return timestamp.toISOString();
}

function buildScheduleOverrideExpiry(schedule, referenceDate = new Date()) {
  const referenceTimestamp = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (Number.isNaN(referenceTimestamp.getTime())) {
    return null;
  }

  const scheduleWindowEndTime = getScheduleWindowEndTime(schedule, referenceTimestamp);
  if (scheduleWindowEndTime instanceof Date && !Number.isNaN(scheduleWindowEndTime.getTime())) {
    return scheduleWindowEndTime.toISOString();
  }

  return new Date(
    referenceTimestamp.getTime() + FREE_OVERRIDE_AFTER_HOURS * 60 * 60 * 1000
  ).toISOString();
}

function hasAnyActiveOverride(state) {
  return Object.values(state.activeOverrides || {}).some((override) => Boolean(getFutureIsoTimestamp(override?.overrideExpiresAt)));
}

export function createRuntimeHub({
  listAssignments,
  reportRuntimeEvent,
  subscribeToAssignments,
  requestOverride,
  confirmOverride,
  cancelOverride,
  settleMeteredPenalty
}) {
  const state = buildInitialState();
  let processScanTimer = null;
  let graceTransitionTimer = null;
  let unsubscribeAssignments = null;
  let stateListener = null;
  let notifiableEventListener = null;
  let enforcementActionListener = null;
  let started = false;

  function emitState() {
    if (typeof stateListener === 'function') {
      stateListener(buildSnapshot(state));
    }
  }

  function emitNotifiableEvent(event) {
    if (typeof notifiableEventListener === 'function') {
      try { notifiableEventListener(event); } catch {}
    }
  }

  function emitEnforcementAction(action) {
    if (typeof enforcementActionListener === 'function') {
      try { enforcementActionListener(action); } catch {}
    }
  }

  function pushCrossSurfaceActivity(entry) {
    state.crossSurfaceActivity = [entry, ...state.crossSurfaceActivity].slice(0, 30);
  }

  function clearGraceTransitionTimer() {
    if (graceTransitionTimer) {
      clearTimeout(graceTransitionTimer);
      graceTransitionTimer = null;
    }
  }

  async function addEvent(eventType, assignment, details = {}) {
    const localEvent = buildEventRecord(eventType, assignment, details);
    state.recentEvents = [localEvent, ...state.recentEvents].slice(0, 12);
    try {
      await reportRuntimeEvent({
        ruleId: assignment.ruleId,
        ownerEmail: state.ownerEmail,
        eventType,
        occurredAt: localEvent.occurredAt,
        details
      });
    } catch {}
  }

  async function refreshAssignments() {
    if (!state.ownerEmail) {
      state.assignments = [];
      emitState();
      return buildSnapshot(state);
    }
    const response = await listAssignments(state.ownerEmail);
    state.assignments = response?.assignments || [];
    state.lastAssignmentSyncAt = toIsoNow();
    emitState();
    return buildSnapshot(state);
  }

  function replaceAssignments(assignments = []) {
    state.assignments = Array.isArray(assignments) ? assignments : [];
    state.lastAssignmentSyncAt = toIsoNow();
    emitState();
    return buildSnapshot(state);
  }

  function replaceExtensionSessions(extensionSessions = []) {
    state.extensionSessions = Array.isArray(extensionSessions) ? extensionSessions : [];
    emitState();
    return buildSnapshot(state);
  }

  function replaceRules(rules = []) {
    state.rules = Array.isArray(rules) ? rules : [];
    syncActiveOverridesFromRules();
    syncPendingOverrideFromRules();
    emitState();
    return buildSnapshot(state);
  }

  function getActiveViolation() {
    return state.meteredViolation || state.pendingViolation || null;
  }

  function syncPendingOverrideFromRules() {
    const activeViolation = getActiveViolation();
    if (!activeViolation) {
      state.pendingOverrideRequest = null;
      return;
    }
    const rule = state.rules.find((r) => r.ruleId === activeViolation.ruleId);
    state.pendingOverrideRequest = rule?.pendingRuleChangeRequests?.override || null;
  }

  function pruneExpiredActiveOverrides() {
    state.activeOverrides = Object.entries(state.activeOverrides || {}).reduce((activeOverrides, [ruleId, override]) => {
      const overrideExpiresAt = getFutureIsoTimestamp(override?.overrideExpiresAt);
      if (overrideExpiresAt) {
        activeOverrides[ruleId] = {
          ...override,
          overrideExpiresAt
        };
      }

      return activeOverrides;
    }, {});
  }

  function syncActiveOverridesFromRules() {
    pruneExpiredActiveOverrides();

    state.activeOverrides = (state.rules || []).reduce((activeOverrides, rule) => {
      if (!rule?.ruleId) {
        return activeOverrides;
      }

      const overrideExpiresAt = getFutureIsoTimestamp(rule.activeOverride?.overrideExpiresAt);
      if (!overrideExpiresAt) {
        return activeOverrides;
      }

      activeOverrides[rule.ruleId] = {
        requestId: rule.activeOverride?.requestId || '',
        confirmedAt: rule.activeOverride?.confirmedAt || null,
        overrideExpiresAt
      };
      return activeOverrides;
    }, { ...(state.activeOverrides || {}) });
  }

  function findActiveOverrideForRule(ruleId) {
    const override = state.activeOverrides?.[ruleId];
    const overrideExpiresAt = getFutureIsoTimestamp(override?.overrideExpiresAt);
    if (!overrideExpiresAt) {
      delete state.activeOverrides?.[ruleId];
      return null;
    }

    return {
      ...override,
      overrideExpiresAt
    };
  }

  function syncGraceTransitionCheck() {
    clearGraceTransitionTimer();
    if (state.meteredViolation?.status !== 'grace_period') {
      return;
    }

    const graceEndsAt = new Date(state.meteredViolation.graceEndsAt || '');
    if (Number.isNaN(graceEndsAt.getTime())) {
      return;
    }

    const delayMs = Math.max(0, graceEndsAt.getTime() - Date.now()) + 25;
    graceTransitionTimer = setTimeout(() => {
      evaluateViolations().catch(() => {});
    }, delayMs);
  }

  async function finalizeMeteredViolation() {
    if (!state.meteredViolation) {
      return;
    }

    const assignment = state.assignments.find((item) => item.ruleId === state.meteredViolation.ruleId);
    const finalAccruedLamports = getMeteredViolationAccruedLamports(state.meteredViolation);

    if (assignment) {
      if (state.meteredViolation.status === 'meter_running' && finalAccruedLamports > 0) {
        if (typeof settleMeteredPenalty === 'function') {
          try {
            await settleMeteredPenalty(state.meteredViolation.ruleId, {
              violationId: state.meteredViolation.violationId,
              amountLamports: finalAccruedLamports,
              meterStartedAt: state.meteredViolation.meterStartedAt,
              meterEndedAt: toIsoNow(),
              matchedTargets: state.meteredViolation.matchedTargets || []
            });
          } catch {}
        }

        await addEvent('escrow_penalty_applied', assignment, {
          matchedTargets: state.meteredViolation.matchedTargets,
          amountLamports: finalAccruedLamports,
          violationId: state.meteredViolation.violationId
        });
        emitNotifiableEvent({
          type: 'metered_penalty_applied',
          title: `${assignment.compiledRule?.summary || assignment.ruleId} closed`,
          body: `${formatMatchedTargetsLabel(state.meteredViolation.matchedTargets)} stopped the live meter at ${formatFeeSol(finalAccruedLamports)} SOL.`
        });
      } else {
        await addEvent('rule_complied', assignment, {
          matchedTargets: state.meteredViolation.matchedTargets,
          violationId: state.meteredViolation.violationId
        });
      }
    }

    state.meteredViolation = null;
    clearGraceTransitionTimer();
  }

  function detectBrowserEvasion() {
    const previousGapKey = buildEnforcementGapKey(state.enforcementGap);
    const hasDomainRules = state.isArmed && state.assignments.some(
      (assignment) => (assignment.compiledRule?.targets || []).some((target) => target.type === 'domain')
    );
    if (!hasDomainRules) {
      state.enforcementGap = null;
      return;
    }

    const extensionConnected = state.extensionSessions.some(
      (session) => session.connectionState === 'connected'
    );
    if (extensionConnected) {
      state.enforcementGap = null;
      return;
    }

    const runningBrowsers = state.visibleProcesses.filter(isKnownBrowserProcess);
    if (runningBrowsers.length > 0) {
      state.enforcementGap = {
        type: 'browser_without_extension',
        detectedAt: toIsoNow(),
        browsers: runningBrowsers,
        message: 'A browser is running without extension protection while domain rules are active.'
      };
    } else {
      state.enforcementGap = null;
    }

    const nextGapKey = buildEnforcementGapKey(state.enforcementGap);
    if (!previousGapKey && nextGapKey && state.enforcementGap) {
      emitNotifiableEvent(buildEnforcementGapNotification(state.enforcementGap));
    }
  }

  async function evaluateViolations() {
    if (!state.ownerEmail || !state.isArmed) {
      emitState();
      return buildSnapshot(state);
    }

    const [visibleProcesses, focusedApplicationName] = await Promise.all([
      listVisibleProcesses(),
      getFocusedApplicationName()
    ]);
    state.visibleProcesses = visibleProcesses;
    state.focusedApplicationName = focusedApplicationName;
    state.lastProcessScanAt = toIsoNow();
    pruneExpiredActiveOverrides();

    detectBrowserEvasion();

    const violatingAssignments = state.assignments.map((assignment) => {
      const appTargets = (assignment.compiledRule?.targets || [])
        .filter((target) => target.type === 'app')
        .map((target) => target.value);
      if (!appTargets.length) return null;

      const processMatches = findMatchingProcessNames(visibleProcesses, appTargets);
      const focusMatches = findMatchingProcessNames([focusedApplicationName], appTargets);
      if (!processMatches.length && !focusMatches.length) return null;

      if (!isScheduleActive(assignment.compiledRule?.schedule)) {
        return null;
      }

      return {
        assignment,
        matchedTargets: [...new Set([...processMatches, ...focusMatches])]
      };
    }).filter(Boolean).filter((entry) => !findActiveOverrideForRule(entry.assignment.ruleId));

    const currentViolationMatch = state.meteredViolation
      ? violatingAssignments.find((entry) => entry.assignment.ruleId === state.meteredViolation.ruleId)
      : null;
    const activeViolation = currentViolationMatch || violatingAssignments[0] || null;

    if (!activeViolation) {
      await finalizeMeteredViolation();

      emitState();
      return buildSnapshot(state);
    }

    if (state.meteredViolation && !currentViolationMatch) {
      await finalizeMeteredViolation();
    }

    if (!state.meteredViolation || state.meteredViolation.ruleId !== activeViolation.assignment.ruleId) {
      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      state.meteredViolation = buildMeteredViolationRecord(
        state.rules.find((rule) => rule.ruleId === activeViolation.assignment.ruleId),
        activeViolation.assignment,
        activeViolation.matchedTargets
      );
      clearGraceTransitionTimer();
      syncGraceTransitionCheck();
      await addEvent('rule_triggered', activeViolation.assignment, { matchedTargets: activeViolation.matchedTargets });
      emitNotifiableEvent(buildDesktopViolationNotification(state.meteredViolation));
      emitEnforcementAction({
        type: 'desktop_violation_detected',
        violationId: state.meteredViolation.violationId,
        bounceType: 'critical',
        pinOnTop: true
      });
      emitState();
      return buildSnapshot(state);
    }

    state.meteredViolation = {
      ...state.meteredViolation,
      matchedTargets: activeViolation.matchedTargets
    };

    if (state.meteredViolation.status === 'grace_period') {
      const graceEndsAt = new Date(state.meteredViolation.graceEndsAt || '');
      if (!Number.isNaN(graceEndsAt.getTime()) && graceEndsAt.getTime() <= Date.now()) {
        state.meteredViolation = {
          ...state.meteredViolation,
          status: 'meter_running',
          meterStartedAt: state.meteredViolation.graceEndsAt,
          accruedLamports: getMeteredViolationAccruedLamports({
            ...state.meteredViolation,
            meterStartedAt: state.meteredViolation.graceEndsAt
          }),
          lastNotificationAt: toIsoNow()
        };
        clearGraceTransitionTimer();
        emitNotifiableEvent(buildMeterRunningNotification(state.meteredViolation));
      } else {
        syncGraceTransitionCheck();
      }
    } else if (state.meteredViolation.status === 'meter_running') {
      const nextAccruedLamports = getMeteredViolationAccruedLamports(state.meteredViolation);
      const nextLastNotificationAt = new Date(state.meteredViolation.lastNotificationAt || 0).getTime();
      state.meteredViolation = {
        ...state.meteredViolation,
        accruedLamports: nextAccruedLamports
      };

      if (Date.now() - nextLastNotificationAt >= METERED_NOTIFICATION_INTERVAL_SECONDS * 1000) {
        state.meteredViolation.lastNotificationAt = toIsoNow();
        emitNotifiableEvent(buildMeterRunningNotification(state.meteredViolation));
      }
    }

    emitState();
    return buildSnapshot(state);
  }

  async function refresh() {
    await refreshAssignments();
    await evaluateViolations();
    return buildSnapshot(state);
  }

  function clearTimers() {
    clearGraceTransitionTimer();
    if (processScanTimer) {
      clearInterval(processScanTimer);
      processScanTimer = null;
    }
    if (typeof unsubscribeAssignments === 'function') {
      unsubscribeAssignments();
      unsubscribeAssignments = null;
    }
  }

  function ensureTimers() {
    if (started) return;
    clearTimers();
    processScanTimer = setInterval(() => {
      evaluateViolations().catch(() => {});
    }, PROCESS_SCAN_INTERVAL_MS);
    if (typeof subscribeToAssignments === 'function') {
      unsubscribeAssignments = subscribeToAssignments((assignments) => {
        replaceAssignments(assignments);
      });
    }
    started = true;
  }

  return {
    getSnapshot() { return buildSnapshot(state); },
    onStateChange(listener) { stateListener = listener; },
    setOwnerEmail(ownerEmail) {
      state.ownerEmail = String(ownerEmail || '');
      emitState();
      return buildSnapshot(state);
    },
    replaceAssignments,
    replaceExtensionSessions,
    replaceRules,
    async setArmed(isArmed) {
      state.isArmed = Boolean(isArmed);
      if (!state.isArmed) {
        state.pendingViolation = null;
        state.pendingOverrideRequest = null;
        state.activeOverrides = {};
        state.meteredViolation = null;
        state.enforcementGap = null;
      }
      emitState();
      return refresh();
    },
    async setPreferences(patch = {}) {
      state.preferences = { ...state.preferences, ...(patch || {}) };
      emitState();
      return buildSnapshot(state);
    },
    async start() {
      ensureTimers();
      return refresh();
    },
    stop() {
      clearTimers();
      started = false;
      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      state.activeOverrides = {};
      state.meteredViolation = null;
      state.enforcementGap = null;
      emitState();
      return buildSnapshot(state);
    },
    async resolveViolation(action) {
      const activeViolation = getActiveViolation();
      if (!activeViolation) return buildSnapshot(state);
      const assignment = state.assignments.find((item) => item.ruleId === activeViolation.ruleId);
      if (!assignment) {
        state.pendingViolation = null;
        if (state.meteredViolation?.ruleId === activeViolation.ruleId) {
          state.meteredViolation = null;
          clearGraceTransitionTimer();
        }
        state.pendingOverrideRequest = null;
        emitState();
        return buildSnapshot(state);
      }

      if (action === 'pay_to_bypass') {
        if (typeof requestOverride === 'function') {
          try {
            const result = await requestOverride(activeViolation.ruleId);
            if (result?.request) {
              state.pendingOverrideRequest = result.request;
              await addEvent('bypass_accepted', assignment, {
                matchedTargets: activeViolation.matchedTargets,
                violationId: activeViolation.violationId
              });
              emitState();
              return buildSnapshot(state);
            }
          } catch {}
        }
      } else {
        if (state.meteredViolation?.ruleId === activeViolation.ruleId) {
          await finalizeMeteredViolation();
        } else {
          await addEvent('rule_complied', assignment, {
            matchedTargets: activeViolation.matchedTargets,
            violationId: activeViolation.violationId
          });
          state.pendingViolation = null;
        }
      }

      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    },
    async confirmPendingOverride() {
      const activeViolation = getActiveViolation();
      if (!activeViolation || !state.pendingOverrideRequest) return buildSnapshot(state);
      const ruleId = activeViolation.ruleId;
      const requestId = state.pendingOverrideRequest.requestId;

      if (typeof confirmOverride === 'function') {
        try {
          await confirmOverride(ruleId, requestId);
        } catch {}
      }

      const assignment = state.assignments.find((item) => item.ruleId === ruleId);
      const rule = state.rules.find((item) => item.ruleId === ruleId);
      if (assignment) {
        await addEvent('bypass_confirmed', assignment, {
          matchedTargets: activeViolation.matchedTargets,
          requestId
        });
      }
      const overrideExpiresAt =
        getFutureIsoTimestamp(state.pendingOverrideRequest.overrideExpiresAt) ||
        getFutureIsoTimestamp(buildScheduleOverrideExpiry(rule?.compiledRule?.schedule, new Date()));
      if (overrideExpiresAt) {
        state.activeOverrides = {
          ...(state.activeOverrides || {}),
          [ruleId]: {
            requestId,
            confirmedAt: state.pendingOverrideRequest.confirmedAt || new Date().toISOString(),
            overrideExpiresAt
          }
        };
      }
      state.pendingViolation = null;
      if (state.meteredViolation?.ruleId === ruleId) {
        state.meteredViolation = null;
        clearGraceTransitionTimer();
      }
      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    },
    async cancelPendingOverride() {
      const activeViolation = getActiveViolation();
      if (!activeViolation || !state.pendingOverrideRequest) return buildSnapshot(state);
      const ruleId = activeViolation.ruleId;
      const requestId = state.pendingOverrideRequest.requestId;

      if (typeof cancelOverride === 'function') {
        try {
          await cancelOverride(ruleId, requestId);
        } catch {}
      }

      const assignment = state.assignments.find((item) => item.ruleId === ruleId);
      if (assignment) {
        await addEvent('bypass_cancelled', assignment, {
          matchedTargets: activeViolation.matchedTargets,
          requestId
        });
      }
      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    },
    onNotifiableEvent(listener) {
      notifiableEventListener = listener;
    },
    onEnforcementAction(listener) {
      enforcementActionListener = listener;
    },
    ingestChainViolation(payload) {
      const entry = {
        eventId: randomUUID(),
        surface: 'chain',
        eventType: 'chain_violation_detected',
        occurredAt: toIsoNow(),
        title: 'Chain violation detected',
        details: payload
      };
      state.chainViolations = [entry, ...state.chainViolations].slice(0, 20);
      state.recentEvents = [entry, ...state.recentEvents].slice(0, 12);
      pushCrossSurfaceActivity(entry);
      emitNotifiableEvent({
        type: 'chain_violation',
        title: entry.title,
        body: buildChainViolationBody(payload),
        navigateTo: 'home'
      });
      emitState();
      return buildSnapshot(state);
    },
    ingestRulesEvent(eventType, payload) {
      const entry = {
        eventId: randomUUID(),
        surface: 'rules',
        eventType,
        occurredAt: toIsoNow(),
        title: formatRulesEventTitle(eventType),
        details: payload
      };
      pushCrossSurfaceActivity(entry);
      if (shouldNotifyForRulesEvent(eventType)) {
        emitNotifiableEvent({ type: 'rules_event', title: entry.title, body: payload?.ruleId || '' });
      }
      emitState();
      return buildSnapshot(state);
    },
    ingestSocialEvent(surface, eventType, payload) {
      const entry = {
        eventId: randomUUID(),
        surface,
        eventType,
        occurredAt: toIsoNow(),
        title: formatSocialEventTitle(surface, eventType),
        details: payload
      };
      pushCrossSurfaceActivity(entry);
      if (shouldNotifyForSocialEvent(surface, eventType)) {
        emitNotifiableEvent({ type: 'social_event', title: entry.title, body: '' });
      }
      emitState();
      return buildSnapshot(state);
    },
    updateDashboard(summary) {
      state.dashboard = summary || null;
      emitState();
      return buildSnapshot(state);
    },
    updateLeaderboard(snapshot) {
      state.leaderboardSnapshot = snapshot || null;
      emitState();
      return buildSnapshot(state);
    },
    setRealtimeConnectionState(connectionState) {
      state.realtimeConnectionState = connectionState || 'idle';
      emitState();
      return buildSnapshot(state);
    }
  };
}

function buildDesktopViolationNotification(meteredViolation) {
  return {
    type: 'desktop_violation',
    title: `Close ${formatMatchedTargetsLabel(meteredViolation?.matchedTargets) || meteredViolation?.title || 'the blocked app'} in 5 seconds`,
    body: buildDesktopViolationBody(meteredViolation),
    navigateTo: 'violations'
  };
}

function buildDesktopViolationBody(meteredViolation) {
  const enforcementMessage = meteredViolation?.summary || 'A blocked desktop app is active.';
  const matchedTargetsLabel = formatMatchedTargetsLabel(meteredViolation?.matchedTargets || []);
  return matchedTargetsLabel
    ? `${enforcementMessage} Close ${matchedTargetsLabel} before the countdown ends or the live meter starts.`
    : `${enforcementMessage} Close the blocked app before the countdown ends or the live meter starts.`;
}

function buildMeterRunningNotification(meteredViolation) {
  const matchedTargetsLabel = formatMatchedTargetsLabel(meteredViolation?.matchedTargets || []);
  const targetLabel = matchedTargetsLabel || meteredViolation?.title || 'The blocked app';
  const accruedLamports = getMeteredViolationAccruedLamports(meteredViolation);

  return {
    type: 'meter_running',
    title: `${targetLabel} is on the meter`,
    body: `${targetLabel} has accrued ${formatFeeSol(accruedLamports)} SOL so far. Close it to stop charging.`,
    navigateTo: 'violations'
  };
}

function buildEnforcementGapNotification(enforcementGap) {
  const browsersLabel = Array.isArray(enforcementGap?.browsers)
    ? enforcementGap.browsers.slice(0, 3).join(', ')
    : '';

  return {
    type: 'enforcement_gap',
    title: 'Browser protection gap detected',
    body: browsersLabel
      ? `${enforcementGap?.message || 'Browser enforcement needs attention.'} Browsers: ${browsersLabel}.`
      : enforcementGap?.message || 'Browser enforcement needs attention.',
    navigateTo: 'home'
  };
}

function buildEnforcementGapKey(enforcementGap) {
  if (!enforcementGap?.type) {
    return '';
  }

  const browsers = Array.isArray(enforcementGap.browsers)
    ? [...enforcementGap.browsers].sort().join(',')
    : '';

  return `${enforcementGap.type}:${browsers}`;
}

function buildChainViolationBody(payload) {
  const violations = payload?.violations;
  const first = Array.isArray(violations) && violations.length > 0 ? violations[0] : null;
  const primaryMessage = first?.message || first?.reason || first?.constraintType || 'A chain rule was violated.';
  const trade = payload?.trade;
  const tradeParts = [
    trade?.direction ? String(trade.direction).toUpperCase() : '',
    trade?.program || '',
    Number.isFinite(trade?.solAmount) ? `${Number(trade.solAmount).toFixed(4)} SOL` : ''
  ].filter(Boolean);

  if (!tradeParts.length) {
    return primaryMessage;
  }

  return `${primaryMessage} ${tradeParts.join(' · ')}.`;
}

function formatMatchedTargetsLabel(matchedTargets = []) {
  return matchedTargets
    .filter(Boolean)
    .slice(0, 4)
    .join(', ');
}

function formatRulesEventTitle(eventType) {
  const labels = {
    rule_created: 'Rule created',
    rule_published: 'Rule published',
    rule_status_updated: 'Rule status changed',
    rule_edited: 'Rule edited',
    runtime_event_recorded: 'Runtime event recorded',
    metered_penalty_recorded: 'Metered penalty recorded'
  };
  return labels[eventType] || eventType;
}

function shouldNotifyForRulesEvent(eventType) {
  return ['rule_created', 'rule_published', 'rule_status_updated', 'metered_penalty_recorded'].includes(eventType);
}

function formatSocialEventTitle(surface, eventType) {
  if (surface === 'friends') return 'Friend activity';
  if (surface === 'direct_messages') return 'New message';
  if (surface === 'campaigns') return 'Campaign update';
  return eventType;
}

function shouldNotifyForSocialEvent(surface, eventType) {
  return surface === 'direct_messages' || (surface === 'friends' && eventType === 'friend_request_received');
}
