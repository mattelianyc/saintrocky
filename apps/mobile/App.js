import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { RootNavigator } from '@/navigation/RootNavigator.jsx';
import { NotificationProvider } from '@/context/NotificationContext.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary.jsx';
import { api } from '@/api/client.js';
import { analytics } from '@/analytics/client.js';
import { notifications } from '@/notifications/client.js';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  parseNotificationNavigation
} from '@/notifications/push.js';
import { connectRealtime, disconnectRealtime } from '@/realtime/client.js';
import { setUnauthorizedHandler } from '@saintrocky/api-client';
import { AnalyticsEvents, trackEvent } from '@saintrocky/analytics';
import { saintRockyBranding } from '@saintrocky/branding';
import { createValidationT, initValidation } from '@saintrocky/validation';
import { createNavigationTheme, ThemeProvider, useTheme } from '@saintrocky/ui-native';

function AppShell() {
  const { theme } = useTheme();
  const navigationRef = useRef(null);
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
    registerForPushNotifications()
      .then((token) => {
        if (token) {
          api.devices.registerPushToken({
            pushToken: token,
            platform: Platform.OS
          }).catch(() => {});
        }
      })
      .catch(() => {});

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
      async register({ name, email, password }) {
        const res = await api.auth.register({ name, email, password });
        setUser(res.user || null);
        trackEvent(analytics, AnalyticsEvents.RegisterSucceeded, {
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
    <>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent
      />
      <ErrorBoundary>
        <NotificationProvider ownerEmail={user?.email}>
          <NavigationContainer ref={navigationRef} theme={navigationTheme}>
            <RootNavigator auth={auth} />
          </NavigationContainer>
        </NotificationProvider>
      </ErrorBoundary>
    </>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'SilkaMono-Regular': require('./assets/fonts/SilkaMono-Regular.ttf')
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
