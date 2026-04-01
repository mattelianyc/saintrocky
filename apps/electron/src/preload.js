import { contextBridge } from 'electron';
import { ipcRenderer } from 'electron';

import {
  cancelRuntimeOverride,
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
  confirmRuntimeOverride,
  cancelRuntimeOverride,
  refreshDesktopDashboard,
  updateNativeRuntimeState(payload) {
    ipcRenderer.send('desktop-runtime:update-state', payload);
  },
  showNativeNotification(payload) {
    return ipcRenderer.invoke('desktop-runtime:show-notification', payload);
  },
  getOpenAtLogin() {
    return ipcRenderer.invoke('desktop-runtime:get-open-at-login');
  },
  setOpenAtLogin(enabled) {
    return ipcRenderer.invoke('desktop-runtime:set-open-at-login', enabled);
  },
  onNavigateFromMain(callback) {
    ipcRenderer.on('desktop-runtime:navigate', (_event, target) => callback(target));
  }
});
