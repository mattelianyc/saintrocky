import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingTop: spacing.small,
      paddingBottom: spacing.jumbo
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: spacing.large,
      paddingHorizontal: spacing.medium
    },
    displayName: {
      fontSize: typography.sizeXlarge,
      fontWeight: typography.weightBlack,
      color: theme.colors.foreground,
      letterSpacing: typography.letterSpacingTight,
      marginTop: spacing.small
    },
    email: {
      fontSize: typography.sizeSmall,
      color: theme.shell.textMuted,
      marginTop: 2
    },
    roleBadge: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightMedium,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      marginTop: spacing.xsmall
    },
    escrowMetrics: {
      flexDirection: 'row',
      paddingHorizontal: spacing.medium,
      gap: spacing.large,
      marginTop: spacing.medium
    },
    sectionKicker: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.accent,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.xlarge,
      paddingBottom: spacing.xsmall
    },
    walletRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    walletLabel: {
      fontSize: typography.sizeBase,
      color: theme.colors.foreground,
      fontWeight: typography.weightSemibold
    },
    walletAddress: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      color: theme.shell.textMuted,
      letterSpacing: typography.letterSpacingWide,
      marginTop: 2
    },
    walletRight: {
      alignItems: 'flex-end',
      gap: 4
    },
    walletBalance: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightBold,
      color: theme.colors.accent
    },
    selectedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.accent
    },
    pressed: {
      opacity: 0.7
    },
    tradeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    tradeInfo: {
      flex: 1
    },
    tradeToken: {
      color: theme.colors.foreground,
      fontSize: typography.sizeBase,
      fontWeight: typography.weightSemibold
    },
    tradeMeta: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      textTransform: 'uppercase',
      marginTop: 2
    },
    tradeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: spacing.small
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    settingsLabel: {
      fontSize: typography.sizeBase,
      color: theme.colors.foreground,
      fontWeight: typography.weightSemibold
    },
    settingsValue: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      color: theme.shell.textMuted,
      letterSpacing: typography.letterSpacingWide,
      marginTop: 2
    },
    logoutSection: {
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.xlarge,
      alignItems: 'center',
      gap: spacing.small
    },
    versionText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted
    }
  });
}
