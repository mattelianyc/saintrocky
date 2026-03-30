import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    listContent: {
      padding: 16,
      paddingBottom: 32
    },
    header: {
      marginBottom: 16
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.foreground,
      marginBottom: 4
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.colors.muted
    },
    entryCard: {
      marginBottom: 8
    },
    currentUserCard: {
      borderColor: theme.colors.accent,
      borderWidth: 1.5
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    rankCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.inputBackground,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10
    },
    rankText: {
      color: theme.colors.foreground,
      fontSize: 13,
      fontWeight: '700'
    },
    podiumRankText: {
      color: '#fff'
    },
    entryBody: {
      flex: 1,
      marginLeft: 10
    },
    entryName: {
      color: theme.colors.foreground,
      fontSize: 15,
      fontWeight: '600'
    },
    entryMeta: {
      color: theme.colors.muted,
      fontSize: 12,
      marginTop: 2
    },
    scoreColumn: {
      alignItems: 'flex-end',
      marginLeft: 12
    },
    scoreValue: {
      color: theme.colors.accent,
      fontSize: 20,
      fontWeight: '800'
    },
    scoreLabel: {
      color: theme.colors.muted,
      fontSize: 10,
      fontWeight: '600'
    },
    youBadge: {
      position: 'absolute',
      top: -6,
      right: -6
    }
  });
}
