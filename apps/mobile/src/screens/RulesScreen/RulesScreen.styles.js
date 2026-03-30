import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border
    },
    filterText: {
      color: theme.colors.foreground,
      fontSize: 12,
      fontWeight: '600'
    },
    filterActiveText: {
      color: theme.colors.primaryText,
      fontSize: 12,
      fontWeight: '600'
    },
    listContent: {
      padding: 16,
      paddingBottom: 32
    }
  });
}
