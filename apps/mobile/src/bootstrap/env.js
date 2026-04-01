import Constants from 'expo-constants';

function patchProcessEnv() {
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!globalThis.process.env) globalThis.process.env = {};

  const extra = Constants?.expoConfig?.extra;
  if (!extra) return;

  const envKeys = Object.keys(extra).filter((key) => key.startsWith('EXPO_PUBLIC_'));
  for (const key of envKeys) {
    if (!globalThis.process.env[key]) {
      globalThis.process.env[key] = String(extra[key]);
    }
  }
}

// Auto-execute on import so process.env is patched before any other module
// reads it (e.g. api-client singleton created at import time).
patchProcessEnv();
