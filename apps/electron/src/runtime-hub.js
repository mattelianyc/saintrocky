import { randomUUID } from 'node:crypto';

import { isScheduleActive } from '@saintrocky/shared';
import { isKnownBrowserProcess } from '@saintrocky/chain';

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
  if (state.enforcementGap) return 'enforcementGap';
  if (state.pendingViolation && state.pendingOverrideRequest) return 'overrideCountdown';
  if (state.pendingViolation) return 'awaitingBypassDecision';
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
  let notifiableEventListener = null;
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

  function pushCrossSurfaceActivity(entry) {
    state.crossSurfaceActivity = [entry, ...state.crossSurfaceActivity].slice(0, 30);
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
              await addEvent('bypass_accepted', assignment, {
                matchedTargets: state.pendingViolation.matchedTargets
              });
              emitState();
              return buildSnapshot(state);
            }
          } catch {}
        }
      } else {
        await addEvent('rule_complied', assignment, { matchedTargets: state.pendingViolation.matchedTargets });
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

      const assignment = state.assignments.find((item) => item.ruleId === ruleId);
      if (assignment) {
        await addEvent('bypass_confirmed', assignment, {
          matchedTargets: state.pendingViolation.matchedTargets,
          requestId
        });
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

      const assignment = state.assignments.find((item) => item.ruleId === ruleId);
      if (assignment) {
        await addEvent('bypass_cancelled', assignment, {
          matchedTargets: state.pendingViolation.matchedTargets,
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
      emitNotifiableEvent({ type: 'chain_violation', title: entry.title, body: buildChainViolationBody(payload) });
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

function buildChainViolationBody(payload) {
  const violations = payload?.violations;
  if (!Array.isArray(violations) || violations.length === 0) return 'A chain rule was violated.';
  const first = violations[0];
  return first.message || first.constraintType || 'A chain rule was violated.';
}

function formatRulesEventTitle(eventType) {
  const labels = {
    rule_created: 'Rule created',
    rule_published: 'Rule published',
    rule_status_updated: 'Rule status changed',
    rule_edited: 'Rule edited',
    runtime_event_recorded: 'Runtime event recorded'
  };
  return labels[eventType] || eventType;
}

function shouldNotifyForRulesEvent(eventType) {
  return ['rule_created', 'rule_published', 'rule_status_updated'].includes(eventType);
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
