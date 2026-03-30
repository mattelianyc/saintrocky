import { createApiClient, setUnauthorizedHandler } from "@saintrocky/api-client";
import { buildRulesChannel, buildRuntimeChannel, createRealtimeClient } from "@saintrocky/realtime";
import { isScheduleActive } from "@saintrocky/shared";

const STORAGE_KEY = "saintRockyExtensionRuntime";
const MESSAGE_TYPES = {
  authHandoff: "SAINTROCKY_EXTENSION_AUTH_HANDOFF",
  getState: "SAINTROCKY_EXTENSION_GET_STATE",
  pageContext: "SAINTROCKY_EXTENSION_PAGE_CONTEXT",
  renderBlock: "SAINTROCKY_EXTENSION_RENDER_BLOCK",
  clearBlock: "SAINTROCKY_EXTENSION_CLEAR_BLOCK",
  setArmed: "SAINTROCKY_EXTENSION_SET_ARMED",
  resolveViolation: "SAINTROCKY_EXTENSION_RESOLVE_VIOLATION",
  signOut: "SAINTROCKY_EXTENSION_SIGN_OUT",
  requestOverride: "SAINTROCKY_EXTENSION_REQUEST_OVERRIDE",
  confirmOverride: "SAINTROCKY_EXTENSION_CONFIRM_OVERRIDE",
  cancelOverride: "SAINTROCKY_EXTENSION_CANCEL_OVERRIDE",
  renderOverrideCountdown: "SAINTROCKY_EXTENSION_RENDER_OVERRIDE_COUNTDOWN"
};

let state = null;
let hasLoadedState = false;
let apiClient = null;
let realtimeClient = null;
let cleanupRuntimeSubscription = null;
let cleanupRulesSubscription = null;

function buildInitialState() {
  return {
    sessionId: crypto.randomUUID(),
    sessionToken: "",
    sessionUser: null,
    connectionState: "idle",
    isArmed: true,
    assignments: [],
    rules: [],
    recentEvents: [],
    pendingViolation: null,
    pendingOverrideRequest: null,
    blockedTabIds: [],
    latestPageContext: null,
    runtimeConfig: {
      apiBaseUrl: "http://localhost:4000"
    }
  };
}

async function ensureState() {
  if (hasLoadedState) return state;
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  state = { ...buildInitialState(), ...(stored?.[STORAGE_KEY] || {}) };
  hasLoadedState = true;
  return state;
}

async function persistState() {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function clearAuthState() {
  state.sessionToken = "";
  state.sessionUser = null;
  state.connectionState = "idle";
  state.assignments = [];
  state.rules = [];
  state.pendingViolation = null;
  state.pendingOverrideRequest = null;
  state.recentEvents = [];
  state.blockedTabIds = [];
  cleanupRuntimeSubscription?.();
  cleanupRuntimeSubscription = null;
  cleanupRulesSubscription?.();
  cleanupRulesSubscription = null;
  realtimeClient?.disconnect();
  realtimeClient = null;
  await persistState();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((tab) => sendTabMessage(tab.id, { type: MESSAGE_TYPES.clearBlock })));
}

setUnauthorizedHandler(() => { clearAuthState().catch(() => {}); });

function getApiClient() {
  if (!apiClient) {
    apiClient = createApiClient({
      baseUrl: state.runtimeConfig.apiBaseUrl,
      getAuthToken() { return state.sessionToken; }
    });
  }
  return apiClient;
}

function rebuildApiClient() {
  apiClient = null;
  return getApiClient();
}

function getDomain(url = "") {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return ""; }
}

function addRecentEvent(eventType, assignment, details = {}) {
  state.recentEvents = [
    {
      eventId: crypto.randomUUID(),
      eventType,
      ruleId: assignment.ruleId,
      title: assignment.compiledRule?.summary || assignment.ruleId,
      occurredAt: new Date().toISOString(),
      details
    },
    ...state.recentEvents
  ].slice(0, 12);
}

async function reportRuntimeEvent(eventType, assignment, details = {}) {
  addRecentEvent(eventType, assignment, details);
  await persistState();
  try {
    await getApiClient().rules.reportRuntimeEvent({
      runtimeSurface: "browser_extension",
      ruleId: assignment.ruleId,
      eventType,
      occurredAt: new Date().toISOString(),
      details
    });
  } catch {}
}

async function publishExtensionSession() {
  if (!realtimeClient || !state.sessionUser?.email) return;
  realtimeClient.publishExtensionSession({
    sessionId: state.sessionId,
    browserName: navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser",
    browserVersion: navigator.userAgent,
    extensionVersion: chrome.runtime.getManifest().version,
    platform: navigator.platform,
    connectionState: state.connectionState === "authenticated" ? "connected" : "disconnected",
    runtimeState: {
      isArmed: state.isArmed,
      assignmentCount: state.assignments.length,
      pendingViolation: Boolean(state.pendingViolation),
      pendingOverrideRequest: Boolean(state.pendingOverrideRequest)
    }
  });
}

async function bootstrapAssignments() {
  if (!state.sessionUser?.email || !state.sessionToken) return;
  const response = await getApiClient().rules.listRuntimeAssignments(
    "browser_extension",
    ["browser_domain_blocking", "browser_navigation_intercept"],
    state.sessionUser.email
  );
  state.assignments = response.assignments || [];
  await persistState();
}

function findPendingOverrideForRule(ruleId) {
  const rule = state.rules.find((r) => r.ruleId === ruleId);
  if (!rule?.pendingRuleChangeRequests) return null;
  return rule.pendingRuleChangeRequests.override || null;
}

function syncPendingOverrideFromRules() {
  if (!state.pendingViolation) return;
  const pending = findPendingOverrideForRule(state.pendingViolation.ruleId);
  state.pendingOverrideRequest = pending;
}

function subscribeRulesChannel() {
  cleanupRulesSubscription?.();
  cleanupRulesSubscription = null;
  if (!realtimeClient || !state.sessionUser?.email) return;

  cleanupRulesSubscription = realtimeClient.subscribe(
    buildRulesChannel(state.sessionUser.email),
    async (message) => {
      if (message.type !== "channel.snapshot") return;
      state.rules = message.payload?.rules || [];
      syncPendingOverrideFromRules();
      await persistState();

      if (state.pendingOverrideRequest && state.pendingViolation) {
        await sendOverrideCountdownToBlockedTabs();
      }

      await publishExtensionSession();
    }
  );
}

function subscribeRuntimeChannel() {
  cleanupRuntimeSubscription?.();
  cleanupRuntimeSubscription = null;
  if (!realtimeClient || !state.sessionUser?.email) return;
  cleanupRuntimeSubscription = realtimeClient.subscribe(
    buildRuntimeChannel(state.sessionUser.email, "browser_extension"),
    async (message) => {
      if (message.type !== "channel.snapshot") return;
      state.assignments = message.payload?.assignments || [];
      await persistState();
      await publishExtensionSession();
    }
  );
}

async function connectRealtime() {
  if (!state.sessionToken) return;
  realtimeClient?.disconnect();
  realtimeClient = createRealtimeClient({
    clientType: "extension",
    baseUrl: state.runtimeConfig.apiBaseUrl,
    authToken: state.sessionToken,
    onAuthRevoked() { clearAuthState().catch(() => {}); }
  });
  realtimeClient.onConnectionStateChange(async (connection) => {
    state.connectionState = connection.state;
    await persistState();
    if (connection.state === "authenticated") {
      subscribeRuntimeChannel();
      subscribeRulesChannel();
      await bootstrapAssignments();
      await publishExtensionSession();
    }
  });
  realtimeClient.connect();
}

async function sendTabMessage(tabId, payload) {
  if (!tabId) return;
  try { await chrome.tabs.sendMessage(tabId, payload); } catch {}
}

async function sendOverrideCountdownToBlockedTabs() {
  if (!state.pendingViolation || !state.pendingOverrideRequest) return;
  const rule = state.rules.find((r) => r.ruleId === state.pendingViolation.ruleId);
  const payload = {
    requestedAt: state.pendingOverrideRequest.requestedAt,
    freeAt: state.pendingOverrideRequest.currentQuote?.freeAt || state.pendingOverrideRequest.freeAt,
    problemIndex: state.pendingOverrideRequest.problemIndex,
    lockedStakeLamports: state.pendingOverrideRequest.lockedStakeLamports,
    ruleId: state.pendingViolation.ruleId,
    requestId: state.pendingOverrideRequest.requestId,
    title: rule?.summary || state.pendingViolation.title,
    summary: state.pendingViolation.summary
  };

  for (const tabId of state.blockedTabIds) {
    await sendTabMessage(tabId, { type: MESSAGE_TYPES.renderOverrideCountdown, payload });
  }
}

function domainMatchesTarget(domain, targetValue) {
  if (!domain || !targetValue) return false;
  const normalizedTarget = targetValue.toLowerCase();
  return domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`);
}

function getTriggeredAssignment(url = "") {
  const domain = getDomain(url);
  if (!domain) return undefined;

  return state.assignments.find((assignment) => {
    const targets = assignment.compiledRule?.targets || [];
    const domainTargets = targets.filter((target) => target.type === "domain");
    if (!domainTargets.length) return false;
    const matchesDomain = domainTargets.some((target) => domainMatchesTarget(domain, target.value));
    if (!matchesDomain) return false;
    return isScheduleActive(assignment.compiledRule?.schedule);
  });
}

async function evaluateTab(tabId, url = "") {
  if (!state.isArmed || !state.sessionUser?.email) {
    return sendTabMessage(tabId, { type: MESSAGE_TYPES.clearBlock });
  }

  const assignment = getTriggeredAssignment(url);
  if (!assignment) {
    state.pendingViolation = null;
    state.pendingOverrideRequest = null;
    state.blockedTabIds = state.blockedTabIds.filter((id) => id !== tabId);
    await persistState();
    await publishExtensionSession();
    return sendTabMessage(tabId, { type: MESSAGE_TYPES.clearBlock });
  }

  state.pendingViolation = {
    violationId: crypto.randomUUID(),
    ruleId: assignment.ruleId,
    title: assignment.compiledRule?.summary || "Rule triggered",
    summary: assignment.compiledRule?.enforcement?.userMessage || "This action is blocked.",
    tabId,
    url,
    domain: getDomain(url)
  };
  state.blockedTabIds = [...new Set([...state.blockedTabIds, tabId])];

  syncPendingOverrideFromRules();

  await reportRuntimeEvent("rule_triggered", assignment, { tabId, url });
  await reportRuntimeEvent("bypass_offered", assignment, { tabId, url });
  await persistState();
  await publishExtensionSession();

  if (state.pendingOverrideRequest) {
    await sendOverrideCountdownToBlockedTabs();
  } else {
    await sendTabMessage(tabId, { type: MESSAGE_TYPES.renderBlock, payload: state.pendingViolation });
  }
}

async function resolveViolation(action = "comply") {
  if (!state.pendingViolation) return state;
  const assignment = state.assignments.find((item) => item.ruleId === state.pendingViolation.ruleId);
  if (!assignment) {
    state.pendingViolation = null;
    state.pendingOverrideRequest = null;
    await persistState();
    return state;
  }

  const tabId = state.pendingViolation.tabId;
  if (action === "pay_to_bypass") {
    try {
      const result = await getApiClient().rules.requestOverride(state.pendingViolation.ruleId);
      if (result?.request) {
        state.pendingOverrideRequest = result.request;
        await persistState();
        await sendOverrideCountdownToBlockedTabs();
        await publishExtensionSession();
        return state;
      }
    } catch (error) {
      await reportRuntimeEvent("override_request_failed", assignment, {
        tabId,
        url: state.pendingViolation.url,
        error: error?.message
      });
      throw error;
    }
  }

  await reportRuntimeEvent("rule_blocked", assignment, { tabId, url: state.pendingViolation.url });

  state.pendingViolation = null;
  state.pendingOverrideRequest = null;
  await persistState();
  await publishExtensionSession();
  return state;
}

async function handleConfirmOverride() {
  if (!state.pendingViolation || !state.pendingOverrideRequest) return state;
  const ruleId = state.pendingViolation.ruleId;
  const requestId = state.pendingOverrideRequest.requestId;

  try {
    await getApiClient().rules.confirmOverrideRequest(ruleId, requestId);
    const tabId = state.pendingViolation.tabId;
    state.blockedTabIds = state.blockedTabIds.filter((id) => id !== tabId);
    await sendTabMessage(tabId, { type: MESSAGE_TYPES.clearBlock });
    state.pendingViolation = null;
    state.pendingOverrideRequest = null;
    await persistState();
    await publishExtensionSession();
  } catch (error) {
    throw error;
  }

  return state;
}

async function handleCancelOverride() {
  if (!state.pendingViolation || !state.pendingOverrideRequest) return state;
  const ruleId = state.pendingViolation.ruleId;
  const requestId = state.pendingOverrideRequest.requestId;

  try {
    await getApiClient().rules.cancelOverrideRequest(ruleId, requestId);
    state.pendingOverrideRequest = null;
    await persistState();
    for (const tabId of state.blockedTabIds) {
      await sendTabMessage(tabId, {
        type: MESSAGE_TYPES.renderBlock,
        payload: state.pendingViolation
      });
    }
    await publishExtensionSession();
  } catch (error) {
    throw error;
  }

  return state;
}

async function handleAuthHandoff(payload = {}) {
  state.sessionToken = payload.token || "";
  state.sessionUser = payload.user || null;
  state.runtimeConfig.apiBaseUrl = payload.apiBaseUrl || state.runtimeConfig.apiBaseUrl;
  rebuildApiClient();
  await persistState();
  await connectRealtime();
}

async function signOutEverywhere() {
  try { await getApiClient().auth.logout(); } catch {}
  await clearAuthState();
  return state;
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureState();
  await persistState();
});

ensureState()
  .then(async () => {
    if (state.sessionToken) {
      rebuildApiClient();
      await connectRealtime();
    }
  })
  .catch(() => {});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab?.url) return;
  await ensureState();
  await evaluateTab(tabId, tab.url);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ensureState()
    .then(async () => {
      if (message?.type === MESSAGE_TYPES.authHandoff) {
        await handleAuthHandoff(message.payload || {});
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.pageContext) {
        state.latestPageContext = message.payload || null;
        await persistState();
        if (sender.tab?.id && message.payload?.url) {
          await evaluateTab(sender.tab.id, message.payload.url);
        }
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === MESSAGE_TYPES.getState) {
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.setArmed) {
        state.isArmed = Boolean(message.payload?.isArmed);
        if (!state.isArmed) {
          state.pendingViolation = null;
          state.pendingOverrideRequest = null;
        }
        await persistState();
        await publishExtensionSession();
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.resolveViolation) {
        await resolveViolation(message.payload?.action || "comply");
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.requestOverride) {
        await resolveViolation("pay_to_bypass");
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.confirmOverride) {
        await handleConfirmOverride();
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.cancelOverride) {
        await handleCancelOverride();
        sendResponse({ ok: true, state });
        return;
      }

      if (message?.type === MESSAGE_TYPES.signOut) {
        await signOutEverywhere();
        sendResponse({ ok: true, state });
        return;
      }

      sendResponse({ ok: false, message: "Unsupported extension message." });
    })
    .catch((error) => {
      sendResponse({ ok: false, message: error?.message || "Extension runtime error." });
    });

  return true;
});
