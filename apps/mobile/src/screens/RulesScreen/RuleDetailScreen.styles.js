import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      padding: 16,
      paddingBottom: 40
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10
    },
    title: {
      color: theme.colors.foreground,
      fontSize: 20,
      fontWeight: '800',
      flex: 1,
      marginRight: 12
    },
    summary: {
      color: theme.colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 20
    },
    detailCard: {
      marginBottom: 8,
      marginHorizontal: 0
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border
    },
    detailLabel: {
      color: theme.colors.muted,
      fontSize: 13,
      flex: 1
    },
    detailValue: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '600',
      flex: 1.5,
      textAlign: 'right'
    },
    actions: {
      marginTop: 24
    }
  });
}
