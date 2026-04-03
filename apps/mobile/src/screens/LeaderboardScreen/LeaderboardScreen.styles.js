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
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.xsmall,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    tableHeaderText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase'
    },
    rankColumn: {
      width: 56
    },
    nameColumn: {
      flex: 1
    },
    scoreColumn: {
      width: 64,
      textAlign: 'right'
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small + 2
    },
    entryRowAlt: {
      backgroundColor: theme.shell.backgroundSoft || 'rgba(255,255,255,0.02)'
    },
    currentUserRow: {
      backgroundColor: theme.colors.accent + '10'
    },
    rankCell: {
      width: 56
    },
    rankText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightBlack,
      letterSpacing: typography.letterSpacingWide
    },
    entryBody: {
      flex: 1,
      marginRight: spacing.xsmall
    },
    entryName: {
      color: theme.colors.foreground,
      fontSize: typography.sizeBase,
      fontWeight: typography.weightSemibold
    },
    currentUserName: {
      color: theme.colors.accent
    },
    entryMeta: {
      fontFamily: typography.fontFamilyMono,
      color: theme.shell.textMuted,
      fontSize: typography.sizeXxsmall,
      letterSpacing: typography.letterSpacingWide,
      marginTop: 2,
      textTransform: 'uppercase'
    },
    scoreValue: {
      width: 64,
      textAlign: 'right',
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeLarge,
      fontWeight: typography.weightBlack,
      color: theme.colors.foreground,
      letterSpacing: typography.letterSpacingTight
    }
  });
}
