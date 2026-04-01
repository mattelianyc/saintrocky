import { loadEnvFiles } from '@saintrocky/config/load-env-files';

let loaded = false;

export function loadDesktopEnvironment() {
  if (loaded) return;
  loadEnvFiles();
  loaded = true;
}
