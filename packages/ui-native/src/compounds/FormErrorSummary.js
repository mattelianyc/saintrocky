import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

export function FormErrorSummary({ messages = [], status = null }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const hasStatus = Boolean(status);

  if (!hasMessages && !hasStatus) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <View style={styles.textArea}>
        {hasMessages
          ? messages.map((message) => (
              <Text key={message} style={styles.text}>{message}</Text>
            ))
          : null}
        {hasStatus ? <Text style={styles.text}>{String(status)}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.error + '10',
      paddingVertical: spacing?.small || 12,
      paddingHorizontal: spacing?.medium || 16,
      marginBottom: spacing?.small || 12
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.error,
      marginTop: 4,
      marginRight: spacing?.small || 10
    },
    textArea: {
      flex: 1,
      gap: 2
    },
    text: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.error,
      fontSize: typography?.sizeSmall || 13,
      lineHeight: 18
    }
  });
}
