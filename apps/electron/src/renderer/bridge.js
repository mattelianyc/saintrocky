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

export function onNavigateFromMain(callback) {
  return getDesktopBridge().onNavigateFromMain(callback);
}
