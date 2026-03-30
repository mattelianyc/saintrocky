import { randomUUID } from 'node:crypto';

import { isScheduleActive } from '@saintrocky/shared';
import { isKnownBrowserProcess } from '@saintrocky/chain';

import { findMatchingProcessNames, getFocusedApplicationName, listVisibleProcesses } from './process-observer.js';

const PROCESS_SCAN_INTERVAL_MS = 5_000;

function buildInitialState() {
  return {
    ownerEmail: '',
    monitorStatus: 'idle',
    isArmed: false,
    assignments: [],
    rules: [],
    recentEvents: [],
    pendingViolation: null,
    pendingOverrideRequest: null,
    extensionSessions: [],
    lastAssignmentSyncAt: null,
    lastProcessScanAt: null,
    visibleProcesses: [],
    focusedApplicationName: '',
    enforcementGap: null,
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
  if (state.enforcementGap) return 'enforcementGap';
  if (state.pendingViolation) return 'awaitingBypassDecision';
  if (state.pendingOverrideRequest) return 'overrideCountdown';
  if (!state.isArmed) return 'idle';
  return state.assignments.length ? 'armed' : 'idle';
}

function buildSnapshot(state) {
  return { ...state, monitorStatus: buildMonitorStatus(state) };
}

function buildViolationRecord(assignment, matches) {
  return {
    violationId: randomUUID(),
    ruleId: assignment.ruleId,
    title: assignment.compiledRule?.summary || assignment.ruleId,
    summary: assignment.compiledRule?.enforcement?.userMessage || 'This rule was triggered.',
    detectedAt: toIsoNow(),
    matchedTargets: matches,
    availableActions: ['comply', 'pay_to_bypass']
  };
}

export function createRuntimeHub({
  listAssignments,
  reportRuntimeEvent,
  subscribeToAssignments,
  requestOverride,
  confirmOverride,
  cancelOverride
}) {
  const state = buildInitialState();
  let processScanTimer = null;
  let unsubscribeAssignments = null;
  let stateListener = null;
  let started = false;

  function emitState() {
    if (typeof stateListener === 'function') {
      stateListener(buildSnapshot(state));
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
    syncPendingOverrideFromRules();
    emitState();
    return buildSnapshot(state);
  }

  function syncPendingOverrideFromRules() {
    if (!state.pendingViolation) return;
    const rule = state.rules.find((r) => r.ruleId === state.pendingViolation.ruleId);
    if (!rule?.pendingRuleChangeRequests) return;
    state.pendingOverrideRequest = rule.pendingRuleChangeRequests.override || null;
  }

  function detectBrowserEvasion() {
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
  }

  async function evaluateViolations() {
    if (!state.ownerEmail || !state.isArmed || state.pendingViolation) {
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

    detectBrowserEvasion();

    const violationAssignment = state.assignments.find((assignment) => {
      const appTargets = (assignment.compiledRule?.targets || [])
        .filter((target) => target.type === 'app')
        .map((target) => target.value);
      if (!appTargets.length) return false;

      const processMatches = findMatchingProcessNames(visibleProcesses, appTargets);
      const focusMatches = findMatchingProcessNames([focusedApplicationName], appTargets);
      if (!processMatches.length && !focusMatches.length) return false;

      return isScheduleActive(assignment.compiledRule?.schedule);
    });

    if (!violationAssignment) {
      emitState();
      return buildSnapshot(state);
    }

    const matchedTargets = [
      ...new Set([
        ...findMatchingProcessNames(
          visibleProcesses,
          (violationAssignment.compiledRule?.targets || []).filter((t) => t.type === 'app').map((t) => t.value)
        ),
        ...findMatchingProcessNames(
          [focusedApplicationName],
          (violationAssignment.compiledRule?.targets || []).filter((t) => t.type === 'app').map((t) => t.value)
        )
      ])
    ];

    state.pendingViolation = buildViolationRecord(violationAssignment, matchedTargets);
    syncPendingOverrideFromRules();
    await addEvent('rule_triggered', violationAssignment, { matchedTargets });
    await addEvent('bypass_offered', violationAssignment, { matchedTargets });
    emitState();
    return buildSnapshot(state);
  }

  async function refresh() {
    await refreshAssignments();
    await evaluateViolations();
    return buildSnapshot(state);
  }

  function clearTimers() {
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
      state.isArmed = false;
      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      state.enforcementGap = null;
      emitState();
      return buildSnapshot(state);
    },
    async resolveViolation(action) {
      if (!state.pendingViolation) return buildSnapshot(state);
      const assignment = state.assignments.find((item) => item.ruleId === state.pendingViolation.ruleId);
      if (!assignment) {
        state.pendingViolation = null;
        state.pendingOverrideRequest = null;
        emitState();
        return buildSnapshot(state);
      }

      if (action === 'pay_to_bypass') {
        if (typeof requestOverride === 'function') {
          try {
            const result = await requestOverride(state.pendingViolation.ruleId);
            if (result?.request) {
              state.pendingOverrideRequest = result.request;
              emitState();
              return buildSnapshot(state);
            }
          } catch {}
        }
        await addEvent('bypass_accepted', assignment, { matchedTargets: state.pendingViolation.matchedTargets });
      } else {
        await addEvent('rule_blocked', assignment, { matchedTargets: state.pendingViolation.matchedTargets });
      }

      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    },
    async confirmPendingOverride() {
      if (!state.pendingViolation || !state.pendingOverrideRequest) return buildSnapshot(state);
      const ruleId = state.pendingViolation.ruleId;
      const requestId = state.pendingOverrideRequest.requestId;

      if (typeof confirmOverride === 'function') {
        try {
          await confirmOverride(ruleId, requestId);
        } catch {}
      }

      state.pendingViolation = null;
      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    },
    async cancelPendingOverride() {
      if (!state.pendingViolation || !state.pendingOverrideRequest) return buildSnapshot(state);
      const ruleId = state.pendingViolation.ruleId;
      const requestId = state.pendingOverrideRequest.requestId;

      if (typeof cancelOverride === 'function') {
        try {
          await cancelOverride(ruleId, requestId);
        } catch {}
      }

      state.pendingOverrideRequest = null;
      emitState();
      return buildSnapshot(state);
    }
  };
}
