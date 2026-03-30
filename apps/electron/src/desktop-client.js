import { createApiClient, setUnauthorizedHandler } from '@saintrocky/api-client';
import {
  buildExtensionSessionsChannel,
  buildRulesChannel,
  buildRuntimeChannel,
  createRealtimeClient
} from '@saintrocky/realtime';
import { ipcRenderer } from 'electron';

import { createRuntimeHub } from './runtime-hub.js';
import { desktopRuntimeModels } from './runtime-models.js';
import { getDesktopRuntimeConfig } from './runtime-config.js';

const runtimeConfig = getDesktopRuntimeConfig();
let sessionUser = null;
let sessionToken = '';
const apiClient = createApiClient({
  baseUrl: runtimeConfig.ELECTRON_API_BASE_URL,
  getAuthToken() {
    return sessionToken;
  }
});
const realtimeClient = createRealtimeClient({
  clientType: 'electron',
  baseUrl: runtimeConfig.ELECTRON_API_BASE_URL,
  getAuthToken() {
    return sessionToken;
  },
  onAuthRevoked() {
    clearLocalSession().catch(() => {});
  }
});
let cleanupExtensionSessionsSubscription = null;
let cleanupRulesSubscription = null;
const runtimeHub = createRuntimeHub({
  listAssignments(ownerEmail) {
    return apiClient.rules.listRuntimeAssignments(
      'desktop_runtime',
      ['desktop_app_focus', 'desktop_process_visibility', 'desktop_notification_delivery'],
      ownerEmail
    );
  },
  reportRuntimeEvent(payload) {
    return apiClient.rules.reportRuntimeEvent({
      runtimeSurface: 'desktop_runtime',
      ...payload
    });
  },
  subscribeToAssignments(listener) {
    const ownerEmail = sessionUser?.email || '';
    if (!ownerEmail) {
      return () => {};
    }

    return realtimeClient.subscribe(buildRuntimeChannel(ownerEmail, 'desktop_runtime'), (message) => {
      if (message.type !== 'channel.snapshot') {
        return;
      }

      listener(message.payload?.assignments || []);
    });
  },
  requestOverride(ruleId) {
    return apiClient.rules.requestOverride(ruleId);
  },
  confirmOverride(ruleId, requestId) {
    return apiClient.rules.confirmOverrideRequest(ruleId, requestId);
  },
  cancelOverride(ruleId, requestId) {
    return apiClient.rules.cancelOverrideRequest(ruleId, requestId);
  }
});
const runtimeHubListeners = new Set();
let hasLoadedPersistedAuthState = false;

runtimeHub.onStateChange((snapshot) => {
  runtimeHubListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {}
  });
});
realtimeClient.onConnectionStateChange((connection) => {
  if (connection.state !== 'authenticated' || !sessionUser?.email) {
    return;
  }

  cleanupExtensionSessionsSubscription?.();
  cleanupExtensionSessionsSubscription = realtimeClient.subscribe(
    buildExtensionSessionsChannel(sessionUser.email),
    (message) => {
      if (message.type !== 'channel.snapshot') {
        return;
      }

      runtimeHub.replaceExtensionSessions(message.payload?.sessions || []);
    }
  );

  cleanupRulesSubscription?.();
  cleanupRulesSubscription = realtimeClient.subscribe(
    buildRulesChannel(sessionUser.email),
    (message) => {
      if (message.type !== 'channel.snapshot') {
        return;
      }

      runtimeHub.replaceRules(message.payload?.rules || []);
    }
  );
});

async function loadPersistedAuthState() {
  if (hasLoadedPersistedAuthState) {
    return;
  }

  const persistedState = await ipcRenderer.invoke('desktop-auth:get-state');
  sessionUser = persistedState?.sessionUser || null;
  sessionToken = persistedState?.sessionToken || '';
  if (sessionUser?.email) {
    runtimeHub.setOwnerEmail(sessionUser.email);
    ensureRealtimeConnection();
  }
  hasLoadedPersistedAuthState = true;
}

async function persistAuthState() {
  hasLoadedPersistedAuthState = true;
  await ipcRenderer.invoke('desktop-auth:set-state', {
    sessionUser,
    sessionToken
  });
}

async function clearPersistedAuthState() {
  hasLoadedPersistedAuthState = true;
  await ipcRenderer.invoke('desktop-auth:clear-state');
}

async function clearLocalSession() {
  sessionUser = null;
  sessionToken = '';
  disconnectRealtimeConnection();
  runtimeHub.stop();
  runtimeHub.setOwnerEmail('');
  runtimeHub.replaceExtensionSessions([]);
  await clearPersistedAuthState();
}

setUnauthorizedHandler(() => {
  clearLocalSession().catch(() => {});
});

function ensureRealtimeConnection() {
  if (!sessionToken) {
    return;
  }

  realtimeClient.connect();
}

function disconnectRealtimeConnection() {
  cleanupExtensionSessionsSubscription?.();
  cleanupExtensionSessionsSubscription = null;
  cleanupRulesSubscription?.();
  cleanupRulesSubscription = null;
  realtimeClient.disconnect();
}

function buildErrorResponse(error, fallbackMessage) {
  return {
    ok: false,
    status: error?.status ?? null,
    code: error?.code || 'UNKNOWN',
    message: error?.message || fallbackMessage,
    details: error?.details || null
  };
}

function isUnauthorizedError(error) {
  return error?.status === 401 || error?.code === 'UNAUTHORIZED';
}

function buildSessionResponse(user = null) {
  return {
    ok: true,
    authenticated: Boolean(user),
    user
  };
}

export function getRuntimeInfo() {
  return {
    ok: true,
    runtime: {
      appName: runtimeConfig.ELECTRON_APP_NAME,
      apiBaseUrl: runtimeConfig.ELECTRON_API_BASE_URL,
      branding: desktopRuntimeModels.branding
    }
  };
}

export async function getSession() {
  await loadPersistedAuthState();
  try {
    const response = await apiClient.auth.me();
    if (response?.user) {
      sessionUser = response.user;
      runtimeHub.setOwnerEmail(response.user.email);
      ensureRealtimeConnection();
      const extensionSessionsResponse = await apiClient.extensionSessions.list(response.user.email);
      runtimeHub.replaceExtensionSessions(extensionSessionsResponse?.sessions || []);
      await persistAuthState();
      await runtimeHub.start();
    } else {
      await clearLocalSession();
    }
    return buildSessionResponse(sessionUser);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await clearLocalSession();
      return buildSessionResponse(sessionUser);
    }
    return buildErrorResponse(error, 'Failed to load session');
  }
}

export async function login(credentials) {
  await loadPersistedAuthState();
  try {
    const response = await apiClient.auth.login(credentials);
    sessionUser = response?.user || null;
    sessionToken = response?.token || '';
    runtimeHub.setOwnerEmail(sessionUser?.email || '');
    ensureRealtimeConnection();
    await persistAuthState();

    const session = await getSession();
    if (session.ok && session.authenticated) {
      return session;
    }

    return buildSessionResponse(response?.user || sessionUser);
  } catch (error) {
    return buildErrorResponse(error, 'Failed to sign in');
  }
}

export async function logout() {
  await loadPersistedAuthState();
  try {
    await apiClient.auth.logout();
    await clearLocalSession();
    return { ok: true };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await clearLocalSession();
      return { ok: true };
    }
    return buildErrorResponse(error, 'Failed to sign out');
  }
}

async function requestControlPlaneData() {
  const [
    dashboardResponse,
    alertsResponse,
    workflowsResponse,
    policiesResponse,
    devicesResponse,
    activityResponse,
    billingResponse,
    desktopSessionsResponse,
    extensionSessionsResponse,
    usersResponse
  ] = await Promise.all([
    apiClient.dashboard.summary(),
    apiClient.alerts.list(),
    apiClient.workflows.list(),
    apiClient.policies.list(),
    apiClient.devices.list(),
    apiClient.activity.list(),
    apiClient.billing.summary(),
    apiClient.desktopSessions.list(),
    apiClient.extensionSessions.list(),
    apiClient.users.list()
  ]);

  return {
    dashboard: dashboardResponse,
    alerts: alertsResponse?.alerts || [],
    workflows: workflowsResponse?.workflows || [],
    policies: policiesResponse?.policies || [],
    devices: devicesResponse?.devices || [],
    activity: activityResponse?.activity || [],
    billing: {
      summary: billingResponse?.summary || null,
      plans: billingResponse?.plans || []
    },
    desktopSessions: desktopSessionsResponse?.sessions || [],
    extensionSessions: extensionSessionsResponse?.sessions || [],
    users: usersResponse?.users || []
  };
}

export async function getDashboard() {
  try {
    return {
      ok: true,
      dashboard: await apiClient.dashboard.summary()
    };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load dashboard');
  }
}

export async function getAlerts() {
  try {
    const response = await apiClient.alerts.list();
    return { ok: true, alerts: response?.alerts || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load alerts');
  }
}

export async function getWorkflows() {
  try {
    const response = await apiClient.workflows.list();
    return { ok: true, workflows: response?.workflows || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load workflows');
  }
}

export async function getPolicies() {
  try {
    const response = await apiClient.policies.list();
    return { ok: true, policies: response?.policies || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load policies');
  }
}

export async function getDevices() {
  try {
    const response = await apiClient.devices.list();
    return { ok: true, devices: response?.devices || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load devices');
  }
}

export async function getActivity() {
  try {
    const response = await apiClient.activity.list();
    return { ok: true, activity: response?.activity || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load activity');
  }
}

export async function getControlPlaneSnapshot() {
  const session = await getSession();
  if (!session.ok) return session;
  if (!session.authenticated) {
    return {
      ok: true,
      authenticated: false,
      user: null,
      snapshot: null
    };
  }

  try {
    return {
      ok: true,
      authenticated: true,
      user: session.user,
      snapshot: await requestControlPlaneData()
    };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return {
        ok: true,
        authenticated: false,
        user: null,
        snapshot: null
      };
    }
    return buildErrorResponse(error, 'Failed to load control plane data');
  }
}

export async function getRuleRuntimeAssignments() {
  await loadPersistedAuthState();
  try {
    const response = await apiClient.rules.listRuntimeAssignments(
      'desktop_runtime',
      ['desktop_app_focus', 'desktop_process_visibility', 'desktop_notification_delivery'],
      sessionUser?.email
    );
    return { ok: true, assignments: response?.assignments || [] };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to load desktop rule assignments');
  }
}

export async function reportRuleRuntimeEvent(payload) {
  await loadPersistedAuthState();
  try {
    return await apiClient.rules.reportRuntimeEvent({
      runtimeSurface: 'desktop_runtime',
      ...payload
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return buildSessionResponse(null);
    }
    return buildErrorResponse(error, 'Failed to report desktop rule event');
  }
}

export async function getRuntimeHubSnapshot() {
  await loadPersistedAuthState();
  if (!sessionUser?.email) {
    return {
      ok: true,
      runtimeHub: runtimeHub.getSnapshot()
    };
  }

  try {
    const snapshot = await runtimeHub.start();
    return {
      ok: true,
      runtimeHub: snapshot
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to load desktop runtime hub');
  }
}

export function subscribeRuntimeHub(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  runtimeHubListeners.add(listener);
  listener(runtimeHub.getSnapshot());
  return () => {
    runtimeHubListeners.delete(listener);
  };
}

export async function setRuntimeArmed(isArmed) {
  await loadPersistedAuthState();
  try {
    return {
      ok: true,
      runtimeHub: await runtimeHub.setArmed(isArmed)
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to update runtime state');
  }
}

export async function setRuntimePreferences(preferences) {
  await loadPersistedAuthState();
  try {
    return {
      ok: true,
      runtimeHub: await runtimeHub.setPreferences(preferences)
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to update runtime preferences');
  }
}

export async function resolveRuntimeViolation(action) {
  await loadPersistedAuthState();
  try {
    return {
      ok: true,
      runtimeHub: await runtimeHub.resolveViolation(action)
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to resolve violation');
  }
}

export async function confirmRuntimeOverride() {
  await loadPersistedAuthState();
  try {
    return {
      ok: true,
      runtimeHub: await runtimeHub.confirmPendingOverride()
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to confirm override');
  }
}

export async function cancelRuntimeOverride() {
  await loadPersistedAuthState();
  try {
    return {
      ok: true,
      runtimeHub: await runtimeHub.cancelPendingOverride()
    };
  } catch (error) {
    return buildErrorResponse(error, 'Failed to cancel override');
  }
}
