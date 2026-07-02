import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    messagesList: {
      paddingVertical: spacing.small
    },
    composerBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.xsmall,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.shell.border,
      backgroundColor: theme.shell.background,
      gap: spacing.xsmall
    },
    composerInput: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: theme.shell.border,
      paddingHorizontal: 0,
      paddingVertical: spacing.xsmall,
      color: theme.colors.foreground,
      backgroundColor: 'transparent',
      maxHeight: 100,
      fontSize: typography.sizeBase,
      fontFamily: typography.fontFamilyBase
    }
  });
}
