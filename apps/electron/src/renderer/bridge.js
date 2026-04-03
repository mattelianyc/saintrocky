function getDesktopBridge() {
  const bridge = globalThis?.window?.saintRockyDesktop;
  if (!bridge) {
    throw new Error('Desktop bridge is not available.');
  }
  return bridge;
}

export function getRuntimeInfo() {
  return getDesktopBridge().getRuntimeInfo();
}

export function getSession() {
  return getDesktopBridge().getSession();
}

export function login(credentials) {
  return getDesktopBridge().login(credentials);
}

export function logout() {
  return getDesktopBridge().logout();
}

export function getDashboard() {
  return getDesktopBridge().getDashboard();
}

export function getControlPlaneSnapshot() {
  return getDesktopBridge().getControlPlaneSnapshot();
}

export function getRuleRuntimeAssignments() {
  return getDesktopBridge().getRuleRuntimeAssignments();
}

export function reportRuleRuntimeEvent(payload) {
  return getDesktopBridge().reportRuleRuntimeEvent(payload);
}

export function getRuntimeHubSnapshot() {
  return getDesktopBridge().getRuntimeHubSnapshot();
}

export function subscribeRuntimeHub(listener) {
  return getDesktopBridge().subscribeRuntimeHub(listener);
}

export function setRuntimeArmed(isArmed) {
  return getDesktopBridge().setRuntimeArmed(isArmed);
}

export function setRuntimePreferences(preferences) {
  return getDesktopBridge().setRuntimePreferences(preferences);
}

export function resolveRuntimeViolation(action) {
  return getDesktopBridge().resolveRuntimeViolation(action);
}

export function confirmRuleOverrideRequest(ruleId, requestId) {
  return getDesktopBridge().confirmRuleOverrideRequest(ruleId, requestId);
}

export function cancelRuleOverrideRequest(ruleId, requestId) {
  return getDesktopBridge().cancelRuleOverrideRequest(ruleId, requestId);
}

export function confirmRuleDeactivationRequest(ruleId, requestId) {
  return getDesktopBridge().confirmRuleDeactivationRequest(ruleId, requestId);
}

export function cancelRuleDeactivationRequest(ruleId, requestId) {
  return getDesktopBridge().cancelRuleDeactivationRequest(ruleId, requestId);
}

export function confirmRuntimeOverride() {
  return getDesktopBridge().confirmRuntimeOverride();
}

export function cancelRuntimeOverride() {
  return getDesktopBridge().cancelRuntimeOverride();
}

export function refreshDesktopDashboard() {
  return getDesktopBridge().refreshDesktopDashboard();
}

export function updateNativeRuntimeState(payload) {
  return getDesktopBridge().updateNativeRuntimeState(payload);
}

export function showNativeNotification(payload) {
  return getDesktopBridge().showNativeNotification(payload);
}

export function getOpenAtLogin() {
  return getDesktopBridge().getOpenAtLogin();
}

export function setOpenAtLogin(enabled) {
  return getDesktopBridge().setOpenAtLogin(enabled);
}

export function getDesktopThemeState() {
  return getDesktopBridge().getDesktopThemeState();
}

export function onDesktopThemeChange(callback) {
  return getDesktopBridge().onDesktopThemeChange(callback);
}

export function getUpdaterState() {
  return getDesktopBridge().getUpdaterState();
}

export function checkForUpdates() {
  return getDesktopBridge().checkForUpdates();
}

export function installUpdate() {
  return getDesktopBridge().installUpdate();
}

export function onUpdaterStateChange(callback) {
  return getDesktopBridge().onUpdaterStateChange(callback);
}

export function onNavigateFromMain(callback) {
  return getDesktopBridge().onNavigateFromMain(callback);
}
