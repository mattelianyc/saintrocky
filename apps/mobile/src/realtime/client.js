import { createRealtimeClient, resolveRealtimeUrl } from '@saintrocky/realtime';
import { api } from '@saintrocky/api-client';

let realtimeClient = null;

export function getMobileRealtimeClient() {
  if (realtimeClient) return realtimeClient;

  realtimeClient = createRealtimeClient({
    clientType: 'mobile',
    getAuthToken: () => api.auth?.getSessionToken?.() || '',
    baseUrl: resolveRealtimeUrl().replace(/^ws/, 'http')
  });

  return realtimeClient;
}

export function connectRealtime() {
  const client = getMobileRealtimeClient();
  client.connect();
  return client;
}

export function disconnectRealtime() {
  if (realtimeClient) {
    realtimeClient.disconnect();
  }
}
