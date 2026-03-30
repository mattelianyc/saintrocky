import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    listContent: {
      paddingBottom: 32
    },
    addCard: {
      margin: 16,
      marginBottom: 0
    },
    addLabel: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10
    },
    addInput: {
      flex: 1
    },
    pendingActions: {
      flexDirection: 'row',
      gap: 6
    },
    threadMeta: {
      alignItems: 'flex-end',
      gap: 4
    },
    threadTime: {
      color: theme.colors.muted,
      fontSize: 11
    },
    campaignCard: {
      marginHorizontal: 16,
      marginBottom: 12
    },
    campaignHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    campaignTitle: {
      color: theme.colors.foreground,
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
      marginRight: 8
    },
    campaignDescription: {
      color: theme.colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8
    },
    campaignMeta: {
      flexDirection: 'row',
      gap: 16
    },
    campaignMetaText: {
      color: theme.colors.muted,
      fontSize: 12
    },
    campaignActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12
    }
  });
}
