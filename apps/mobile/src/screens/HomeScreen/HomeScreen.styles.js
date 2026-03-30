import { StyleSheet } from 'react-native';

export function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    content: {
      padding: 16,
      paddingBottom: 32
    },
    greeting: {
      marginBottom: 20
    },
    greetingName: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.foreground,
      marginBottom: 4
    },
    greetingSubtitle: {
      fontSize: 14,
      color: theme.colors.muted
    },
    metricsRow: {
      flexDirection: 'row',
      marginBottom: 10
    },
    metricSpacer: {
      width: 10
    },
    violationWrapper: {
      paddingHorizontal: 16,
      marginBottom: 10
    },
    activityList: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginHorizontal: 16,
      overflow: 'hidden'
    }
  });
}
