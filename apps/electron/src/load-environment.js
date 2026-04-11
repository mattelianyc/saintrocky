import { app } from 'electron';

import { loadEnvFiles } from '@saintrocky/config/load-env-files';

let loaded = false;
const productionDesktopApiBaseUrl = 'https://www.thestandard.dev';
const productionPublicSiteUrl = 'https://www.thestandard.dev';

function applyPackagedProductionDefaults() {
  if (!app.isPackaged) {
    return;
  }

  process.env.APP_ENV = process.env.APP_ENV || 'production';
  process.env.API_BASE_URL = process.env.API_BASE_URL || productionDesktopApiBaseUrl;
  process.env.ELECTRON_API_BASE_URL = process.env.ELECTRON_API_BASE_URL || productionDesktopApiBaseUrl;
  process.env.PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || productionPublicSiteUrl;
}

export function loadDesktopEnvironment() {
  if (loaded) return;
  loadEnvFiles();
  applyPackagedProductionDefaults();
  loaded = true;
}
