import { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormik } from 'formik';

import { analytics } from '@/analytics/client.js';
import { notifications } from '@/notifications/client.js';
import { brandImages } from '@/assets/images.js';
import { saintRockyBranding } from '@saintrocky/branding';
import { createValidationT, flattenValidationErrors, loginSchema } from '@saintrocky/validation';
import { AnalyticsEvents, trackEvent } from '@saintrocky/analytics';
import { LoginScreenConfig } from '@/screens/LoginScreen/LoginScreen.config.js';
import { createStyles } from '@/screens/LoginScreen/LoginScreen.styles.js';
import { Button, FormErrorSummary, TextField, useTheme } from '@saintrocky/ui-native';

export function LoginScreen({ auth, navigation }) {
  const { theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const validationTranslate = createValidationT('en');
  const passwordRef = useRef(null);

  useEffect(() => {
    trackEvent(analytics, AnalyticsEvents.PageViewed, { page: 'login', platform: 'mobile' });
  }, []);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);
      try {
        await auth.login(values);
      } catch (error) {
        const message = error?.message || 'Login failed';
        helpers.setStatus(message);
        trackEvent(analytics, AnalyticsEvents.LoginFailed, { platform: 'mobile' });
        notifications.notify({ title: 'Login failed', message });
      }
    }
  });

  const summaryMessages =
    formik.submitCount > 0
      ? flattenValidationErrors(formik.errors).map(validationTranslate)
      : [];

  return (
    <View style={styles.container}>
      <Image
        source={brandImages.cherryBlossomTree}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.topSection}>
            <Image source={brandImages.navLogo} style={styles.navLogo} resizeMode="contain" />
          </View>

          <View style={styles.brandArea}>
            <Image source={brandImages.mascot} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.heading}>{LoginScreenConfig.heading}</Text>
            <Text style={styles.summary}>{saintRockyBranding.auth.summary}</Text>
          </View>

          <View style={styles.formArea}>
            <FormErrorSummary
              messages={summaryMessages}
              status={formik.status ? String(formik.status) : null}
            />

            <TextField
              label="Email"
              value={formik.values.email}
              onChangeText={(text) => formik.setFieldValue('email', text)}
              onBlur={() => formik.setFieldTouched('email', true)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              error={
                formik.touched.email && formik.errors.email
                  ? validationTranslate(String(formik.errors.email))
                  : null
              }
            />

            <TextField
              ref={passwordRef}
              label="Password"
              value={formik.values.password}
              onChangeText={(text) => formik.setFieldValue('password', text)}
              onBlur={() => formik.setFieldTouched('password', true)}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={formik.handleSubmit}
              error={
                formik.touched.password && formik.errors.password
                  ? validationTranslate(String(formik.errors.password))
                  : null
              }
            />

            <View style={styles.submitArea}>
              <Button
                onPress={formik.handleSubmit}
                disabled={formik.isSubmitting}
                leadingIconName="lock"
                size="lg"
              >
                {formik.isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
                style={styles.themeToggle}
              >
                <Text style={[styles.themeToggleText, { color: theme.colors.accent }]}>
                  CREATE ACCOUNT
                </Text>
              </TouchableOpacity>
              <Text style={styles.footerDivider}>·</Text>
              <TouchableOpacity
                onPress={toggleTheme}
                accessibilityRole="button"
                style={styles.themeToggle}
              >
                <Text style={styles.themeToggleText}>
                  {theme.mode === 'dark' ? 'LIGHT' : 'DARK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
