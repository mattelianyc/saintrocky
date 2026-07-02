import { createApiClient } from '@saintrocky/api-client';
import { appConfig } from '@/config/app-config.js';

export const api = createApiClient({ baseUrl: appConfig.EXPO_PUBLIC_API_URL });
