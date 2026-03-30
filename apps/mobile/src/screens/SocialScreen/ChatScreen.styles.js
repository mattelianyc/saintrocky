import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    messagesList: {
      paddingVertical: 12
    },
    composerBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card
    },
    composerInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      color: theme.colors.foreground,
      backgroundColor: theme.colors.inputBackground,
      maxHeight: 100,
      fontSize: 15
    }
  });
}
