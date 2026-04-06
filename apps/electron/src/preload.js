import { contextBridge } from 'electron';
import { ipcRenderer } from 'electron';

import {
  cancelRuleDeactivationRequest,
  cancelRuleOverrideRequest,
  cancelRuntimeOverride,
  confirmRuleDeactivationRequest,
  confirmRuleOverrideRequest,
  confirmRuntimeOverride,
  getActivity,
  getAlerts,
  getControlPlaneSnapshot,
  getDashboard,
  getDevices,
  getRuntimeHubSnapshot,
  getRuleRuntimeAssignments,
  getPolicies,
  getRuntimeInfo,
  getSession,
  getWorkflows,
  login,
  logout,
  refreshDesktopDashboard,
  reportRuleRuntimeEvent,
  resolveRuntimeViolation,
  setRuntimeArmed,
  setRuntimePreferences,
  subscribeRuntimeHub
} from './desktop-client.js';

contextBridge.exposeInMainWorld('saintRockyDesktop', {
  getRuntimeInfo,
  getSession,
  login,
  logout,
  getDashboard,
  getAlerts,
  getWorkflows,
  getPolicies,
  getDevices,
  getActivity,
  getControlPlaneSnapshot,
  getRuntimeHubSnapshot,
  getRuleRuntimeAssignments,
  reportRuleRuntimeEvent,
  subscribeRuntimeHub,
  setRuntimeArmed,
  setRuntimePreferences,
  resolveRuntimeViolation,
  confirmRuleOverrideRequest,
  cancelRuleOverrideRequest,
  confirmRuleDeactivationRequest,
  cancelRuleDeactivationRequest,
  confirmRuntimeOverride,
  cancelRuntimeOverride,
  refreshDesktopDashboard,
  updateNativeRuntimeState(payload) {
    ipcRenderer.send('desktop-runtime:update-state', payload);
  },
  showNativeNotification(payload) {
    return ipcRenderer.invoke('desktop-runtime:show-notification', payload);
  },
  requestNativeAttention(payload) {
    return ipcRenderer.invoke('desktop-runtime:request-attention', payload);
  },
  getOpenAtLogin() {
    return ipcRenderer.invoke('desktop-runtime:get-open-at-login');
  },
  setOpenAtLogin(enabled) {
    return ipcRenderer.invoke('desktop-runtime:set-open-at-login', enabled);
  },
  getDesktopThemeState() {
    return ipcRenderer.invoke('desktop-theme:get-state');
  },
  onDesktopThemeChange(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop-theme:state', listener);
    return () => ipcRenderer.off('desktop-theme:state', listener);
  },
  getUpdaterState() {
    return ipcRenderer.invoke('desktop-updater:get-state');
  },
  checkForUpdates() {
    return ipcRenderer.invoke('desktop-updater:check');
  },
  installUpdate() {
    return ipcRenderer.invoke('desktop-updater:install');
  },
  onUpdaterStateChange(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop-updater:state', listener);
    return () => ipcRenderer.off('desktop-updater:state', listener);
  },
  onNavigateFromMain(callback) {
    ipcRenderer.on('desktop-runtime:navigate', (_event, target) => callback(target));
  },
  onMeterOverlayStateChange(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('desktop-runtime:meter-overlay-state', listener);
    return () => ipcRenderer.off('desktop-runtime:meter-overlay-state', listener);
  }
});
