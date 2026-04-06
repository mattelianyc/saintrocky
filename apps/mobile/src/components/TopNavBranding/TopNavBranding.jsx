import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@saintrocky/ui-native';

import { brandImages } from '@/assets/images.js';

export function TopNavBranding({
  title,
  subtitle,
  variant = 'header',
  onPress
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isAuthVariant = variant === 'auth';
  const shouldShowCopy = Boolean(title || subtitle);
  const Container = onPress ? Pressable : View;
  const interactiveProps = onPress
    ? {
        onPress,
        accessibilityRole: 'button',
        accessibilityLabel: 'Open live activity'
      }
    : {};

  return (
    <Container
      style={[styles.container, isAuthVariant ? styles.authContainer : styles.headerContainer]}
      {...interactiveProps}
    >
      {!shouldShowCopy ? (
        <Image
          source={brandImages.navLogo}
          style={[styles.logo, isAuthVariant ? styles.authLogo : styles.headerLogo]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.copyBlock}>
          {title ? (
            <Text
              style={[styles.title, isAuthVariant ? styles.authTitle : styles.headerTitle]}
              numberOfLines={isAuthVariant ? 2 : 1}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={[styles.subtitle, isAuthVariant ? styles.authSubtitle : styles.headerSubtitle]}
              numberOfLines={isAuthVariant ? 3 : 1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Container>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    headerContainer: {
      gap: spacing.xxsmall
    },
    authContainer: {
      width: '100%',
      gap: spacing.small
    },
    logo: {
      alignSelf: 'center'
    },
    headerLogo: {
      width: 164,
      height: 28
    },
    authLogo: {
      width: 164,
      height: 28,
      opacity: 0.9
    },
    copyBlock: {
      alignItems: 'center'
    },
    title: {
      textAlign: 'center'
    },
    headerTitle: {
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightBlack,
      color: theme.colors.foreground,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase'
    },
    authTitle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeLarge,
      fontWeight: typography.weightBlack,
      color: '#f5faf7',
      letterSpacing: typography.letterSpacingTight
    },
    subtitle: {
      marginTop: spacing.xxsmall,
      textAlign: 'center'
    },
    headerSubtitle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase'
    },
    authSubtitle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      color: 'rgba(245, 250, 247, 0.55)',
      textTransform: 'uppercase'
    }
  });
}
