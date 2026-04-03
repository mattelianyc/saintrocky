import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    listContent: {
      paddingTop: spacing.small,
      paddingBottom: spacing.xxlarge
    },
    walletSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.medium,
      gap: spacing.xsmall,
      marginBottom: spacing.medium
    },
    walletPill: {
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.xxsmall + 2,
      borderRadius: 2
    },
    walletPillActive: {
      backgroundColor: theme.colors.accent + '18'
    },
    walletPillText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightMedium,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase'
    },
    walletPillTextActive: {
      color: theme.colors.accent,
      fontWeight: typography.weightBold
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.small,
      gap: spacing.xsmall
    },
    statText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.shell.textMuted
    },
    statDivider: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall
    },
    tradeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.small + 2,
      paddingHorizontal: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    tradeRowViolation: {
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.error
    },
    tradeLeft: {
      flex: 1
    },
    tradeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xsmall
    },
    tradeToken: {
      color: theme.colors.foreground,
      fontSize: typography.sizeBase,
      fontWeight: typography.weightSemibold
    },
    sideTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 2
    },
    sideTagText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: 9,
      fontWeight: typography.weightBold,
      letterSpacing: typography.letterSpacingWide
    },
    tradeMeta: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase',
      marginTop: 2
    },
    tradeAmount: {
      fontFamily: typography.fontFamilyMono,
      color: theme.colors.foreground,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightMedium,
      marginTop: 2
    },
    tradeRight: {
      marginLeft: spacing.small
    },
    violationIndicator: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: theme.colors.error + '18'
    },
    violationText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: 9,
      fontWeight: typography.weightBold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.colors.error
    },
    cleanIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success
    }
  });
}
