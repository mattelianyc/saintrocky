import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

function formatMessageTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatBubble({ message, isOwn = false }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, isOwn && styles.ownRow]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {message?.body || ''}
        </Text>
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
          {formatMessageTime(message?.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginBottom: spacing?.xxsmall || 4,
      paddingHorizontal: spacing?.medium || 16
    },
    ownRow: {
      justifyContent: 'flex-end'
    },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: spacing?.medium || 14,
      paddingVertical: spacing?.xsmall || 10
    },
    ownBubble: {
      backgroundColor: theme.colors.accent,
      borderRadius: 2,
      borderBottomRightRadius: 0
    },
    otherBubble: {
      backgroundColor: theme.shell?.backgroundSoft || theme.colors.inputBackground,
      borderRadius: 2,
      borderBottomLeftRadius: 0
    },
    text: {
      fontSize: typography?.sizeBase || 15,
      lineHeight: 20
    },
    ownText: {
      color: theme.colors.primaryText
    },
    otherText: {
      color: theme.colors.foreground
    },
    time: {
      fontFamily: typography?.fontFamilyMono || 'System',
      fontSize: typography?.sizeXxsmall || 10,
      marginTop: 4,
      alignSelf: 'flex-end',
      letterSpacing: typography?.letterSpacingWide || 1.2
    },
    ownTime: {
      color: theme.colors.primaryText,
      opacity: 0.6
    },
    otherTime: {
      color: theme.shell?.textMuted || theme.colors.muted
    }
  });
}
