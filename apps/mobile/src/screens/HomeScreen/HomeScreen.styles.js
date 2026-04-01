import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingBottom: spacing.xxlarge
    },
    metricsGrid: {
      flexDirection: 'row',
      paddingHorizontal: spacing.medium,
      gap: spacing.large,
      marginBottom: spacing.large
    },
    sectionKicker: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      marginTop: spacing.xlarge,
      marginBottom: spacing.xsmall,
      paddingHorizontal: spacing.medium
    },
    violationWrapper: {
      paddingHorizontal: spacing.medium
    },
    activityList: {
      marginTop: spacing.xxsmall
    },
    tradeLink: {
      paddingHorizontal: spacing.medium,
      marginTop: spacing.small,
      alignItems: 'flex-start'
    }
  });
}
