import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    topActionRow: {
      alignItems: 'flex-start',
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.small,
      paddingBottom: spacing.xsmall
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.medium,
      gap: spacing.xsmall,
      marginBottom: spacing.small
    },
    filterPill: {
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.xxsmall + 2,
      borderRadius: 2,
      minWidth: 88
    },
    filterPillActive: {
      backgroundColor: theme.colors.accent + '18'
    },
    filterText: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      fontWeight: typography.weightMedium,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase'
    },
    filterTextActive: {
      color: theme.colors.accent,
      fontWeight: typography.weightBold
    },
    listContent: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.xxlarge
    }
  });
}
