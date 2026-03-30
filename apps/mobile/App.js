import { useEffect, useMemo, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from '@/navigation/RootNavigator.jsx';
import { bootstrapEnv } from '@/bootstrap/env.js';
import { analytics } from '@/analytics/client.js';
import { notifications } from '@/notifications/client.js';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  parseNotificationNavigation
} from '@/notifications/push.js';
import { connectRealtime, disconnectRealtime } from '@/realtime/client.js';
import { api, setUnauthorizedHandler } from '@saintrocky/api-client';
import { AnalyticsEvents, trackEvent } from '@saintrocky/analytics';
import { saintRockyBranding } from '@saintrocky/branding';
import { createValidationT, initValidation } from '@saintrocky/validation';
import { createNavigationTheme, ThemeProvider, useTheme } from '@saintrocky/ui-native';

function AppShell() {
  const { theme } = useTheme();
  const navigationRef = useRef(null);
  bootstrapEnv();
  initValidation({ t: createValidationT('en') });

  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      disconnectRealtime();
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const res = await api.auth.me();
        if (!cancelled) setUser(res.user || null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setStatus('ready');
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    connectRealtime();
    registerForPushNotifications().catch(() => {});

    return () => {
      disconnectRealtime();
    };
  }, [user]);

  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      const nav = parseNotificationNavigation(response.notification);
      if (nav && navigationRef.current) {
        navigationRef.current.navigate(nav.screen, nav.params);
      }
    });
    return () => subscription?.remove();
  }, []);

  const auth = useMemo(() => {
    return {
      status,
      user,
      async login({ email, password }) {
        const res = await api.auth.login({ email, password });
        setUser(res.user || null);
        trackEvent(analytics, AnalyticsEvents.LoginSucceeded, {
          platform: 'mobile',
          product: saintRockyBranding.shortProductName
        });
        return res;
      },
      async logout() {
        try {
          await api.auth.logout();
          trackEvent(analytics, AnalyticsEvents.Logout, {
            platform: 'mobile',
            product: saintRockyBranding.shortProductName
          });
        } catch (error) {
          notifications.notify({
            title: 'Logout failed',
            message: error?.message || 'Unable to log out right now.'
          });
        } finally {
          disconnectRealtime();
          setUser(null);
        }
      }
    };
  }, [status, user]);

  const navigationTheme = useMemo(() => createNavigationTheme(theme), [theme]);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootNavigator auth={auth} navigationRef={navigationRef} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
