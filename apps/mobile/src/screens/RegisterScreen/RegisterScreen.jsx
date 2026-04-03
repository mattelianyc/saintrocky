import { useMemo, useRef } from 'react';
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
import { createValidationT, flattenValidationErrors, registerSchema } from '@saintrocky/validation';
import { AnalyticsEvents, trackEvent } from '@saintrocky/analytics';
import { RegisterScreenConfig } from '@/screens/RegisterScreen/RegisterScreen.config.js';
import { createStyles } from '@/screens/RegisterScreen/RegisterScreen.styles.js';
import { TopNavBranding } from '@/components/TopNavBranding/TopNavBranding.jsx';
import { Button, FormErrorSummary, TextField, useTheme } from '@saintrocky/ui-native';

export function RegisterScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const validationTranslate = createValidationT('en');
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '' },
    validationSchema: registerSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);
      try {
        await auth.register(values);
        trackEvent(analytics, AnalyticsEvents.RegisterSucceeded, { platform: 'mobile' });
      } catch (error) {
        const message = error?.message || 'Registration failed';
        helpers.setStatus(message);
        trackEvent(analytics, AnalyticsEvents.RegisterFailed, { platform: 'mobile' });
        notifications.notify({ title: 'Registration failed', message });
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
          <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
            <TopNavBranding
              variant="auth"
              title={RegisterScreenConfig.heading}
              subtitle={saintRockyBranding.auth.summary}
            />
          </View>

          <View style={styles.formArea}>
            <FormErrorSummary
              messages={summaryMessages}
              status={formik.status ? String(formik.status) : null}
            />

            <TextField
              label="Name"
              value={formik.values.name}
              onChangeText={(text) => formik.setFieldValue('name', text)}
              onBlur={() => formik.setFieldTouched('name', true)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              error={
                formik.touched.name && formik.errors.name
                  ? validationTranslate(String(formik.errors.name))
                  : null
              }
            />

            <TextField
              ref={emailRef}
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
                leadingIconName="user"
                size="lg"
              >
                {formik.isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                style={styles.switchLink}
              >
                <Text style={styles.switchLinkText}>ALREADY HAVE AN ACCOUNT? SIGN IN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
