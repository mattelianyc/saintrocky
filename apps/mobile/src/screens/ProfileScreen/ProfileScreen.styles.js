import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      paddingBottom: 40
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 16
    },
    displayName: {
      color: theme.colors.foreground,
      fontSize: 20,
      fontWeight: '800',
      marginTop: 12,
      marginBottom: 4
    },
    email: {
      color: theme.colors.muted,
      fontSize: 14,
      marginBottom: 8
    },
    walletCard: {
      marginHorizontal: 16
    },
    escrowRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    escrowLabel: {
      color: theme.colors.muted,
      fontSize: 14
    },
    escrowValue: {
      color: theme.colors.accent,
      fontSize: 20,
      fontWeight: '800'
    },
    walletBalance: {
      color: theme.colors.accent,
      fontSize: 14,
      fontWeight: '700'
    },
    tradesCard: {
      marginHorizontal: 16
    },
    tradeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border
    },
    tradeInfo: {
      flex: 1
    },
    tradeToken: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '600'
    },
    tradeMeta: {
      color: theme.colors.muted,
      fontSize: 12,
      marginTop: 2
    },
    tradeStatus: {
      marginLeft: 12
    },
    logoutSection: {
      paddingHorizontal: 16,
      paddingTop: 24,
      alignItems: 'center',
      gap: 12
    },
    versionText: {
      color: theme.colors.muted,
      fontSize: 12
    }
  });
}
