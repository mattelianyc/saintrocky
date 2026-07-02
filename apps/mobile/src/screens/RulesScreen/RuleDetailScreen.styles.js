import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.xxlarge,
      paddingTop: spacing.medium
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xsmall
    },
    title: {
      flex: 1,
      fontSize: typography.sizeXlarge,
      fontWeight: typography.weightBlack,
      color: theme.colors.foreground,
      letterSpacing: typography.letterSpacingTight
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: spacing.small
    },
    summary: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeBase,
      lineHeight: 22,
      marginBottom: spacing.medium
    },
    sectionKicker: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      marginTop: spacing.large,
      marginBottom: spacing.small
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.small,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    detailLabel: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXsmall,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase'
    },
    detailValue: {
      color: theme.colors.foreground,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightMedium,
      maxWidth: '55%',
      textAlign: 'right'
    },
    actions: {
      marginTop: spacing.xlarge
    },
    actionSpacer: {
      height: spacing.xsmall
    },
    cooldownSection: {
      paddingVertical: spacing.medium,
      alignItems: 'center'
    },
    cooldownTimer: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeJumbo || 32,
      fontWeight: typography.weightBlack,
      color: theme.colors.warning,
      letterSpacing: typography.letterSpacingWide
    },
    cooldownReady: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeLarge,
      fontWeight: typography.weightBlack,
      color: theme.colors.success,
      letterSpacing: typography.letterSpacingUltraWide
    },
    cooldownHint: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      textAlign: 'center',
      marginTop: spacing.xsmall,
      lineHeight: 20
    }
  });
}
