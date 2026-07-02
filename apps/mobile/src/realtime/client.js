import { createRealtimeClient } from '@saintrocky/realtime';
import { api } from '@/api/client.js';
import { appConfig } from '@/config/app-config.js';

let realtimeClient = null;
let realtimeAuthToken = '';
let realtimeTokenPromise = null;

async function ensureRealtimeToken() {
  if (realtimeAuthToken) {
    return realtimeAuthToken;
  }
  if (realtimeTokenPromise) {
    return realtimeTokenPromise;
  }

  realtimeTokenPromise = api.auth
    .createRuntimeToken({ runtimeSurface: 'mobile' })
    .then((response) => {
      realtimeAuthToken = response?.token || '';
      return realtimeAuthToken;
    })
    .finally(() => {
      realtimeTokenPromise = null;
    });

  return realtimeTokenPromise;
}

export function getMobileRealtimeClient() {
  if (realtimeClient) return realtimeClient;

  realtimeClient = createRealtimeClient({
    clientType: 'mobile',
    apiBaseUrl: appConfig.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
    getAuthToken: () => realtimeAuthToken,
    onAuthRevoked() {
      realtimeAuthToken = '';
    }
  });

  return realtimeClient;
}

export async function connectRealtime() {
  await ensureRealtimeToken().catch(() => {});
  const client = getMobileRealtimeClient();
  client.connect();
  return client;
}

export function disconnectRealtime() {
  if (realtimeClient) {
    realtimeClient.disconnect();
  }
}
