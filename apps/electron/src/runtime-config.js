import { loadElectronRuntimeConfig } from '@saintrocky/config';

import { loadDesktopEnvironment } from './load-environment.js';

export function getDesktopRuntimeConfig() {
  loadDesktopEnvironment();
  return loadElectronRuntimeConfig(process.env);
}
