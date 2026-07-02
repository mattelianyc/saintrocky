import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@saintrocky/ui-native';
import { brandImages } from '@/assets/images.js';

export function ScreenHeader({
  kicker,
  title,
  trailing,
  showLogo = false,
  showWatermark = false,
  includeSafeArea = false
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const topPadding = includeSafeArea
    ? insets.top + theme.spacing.medium
    : theme.spacing.medium;

  return (
    <View style={[styles.container]}>
      <View style={styles.contentRow}>
        <View style={styles.textBlock}>
          {(showLogo || kicker) && (
            <View style={styles.kickerRow}>
              {showLogo && (
                <Image
                  source={brandImages.navLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
              {kicker && <Text style={styles.kicker}>{kicker}</Text>}
            </View>
          )}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {trailing || null}
          </View>
        </View>

        {showWatermark && (
          <View style={styles.watermarkSlot}>
            <Image
              source={brandImages.monogramMark}
              style={styles.watermark}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.small,
      overflow: 'hidden'
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: 72
    },
    textBlock: {
      flex: 1,
      paddingRight: spacing.medium
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xsmall,
      marginBottom: spacing.xxsmall
    },
    watermarkSlot: {
      width: 108,
      alignItems: 'flex-end',
      justifyContent: 'flex-end'
    },
    watermark: {
      width: 96,
      height: 96,
      opacity: 0.05
    },
    logo: {
      width: 20,
      height: 20,
      opacity: 0.55
    },
    kicker: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase'
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      flex: 1,
      fontSize: typography.sizeLarge,
      fontWeight: typography.weightBlack,
      color: theme.colors.foreground,
      letterSpacing: typography.letterSpacingTight,
      paddingRight: spacing.small
    }
  });
}
