import { contextBridge } from 'electron';
import { ipcRenderer } from 'electron';

import {
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
  updateNativeRuntimeState(payload) {
    ipcRenderer.send('desktop-runtime:update-state', payload);
  },
  showNativeNotification(payload) {
    return ipcRenderer.invoke('desktop-runtime:show-notification', payload);
  }
});
