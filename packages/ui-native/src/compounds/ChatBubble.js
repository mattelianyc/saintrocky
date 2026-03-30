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
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      marginBottom: 6,
      paddingHorizontal: 12
    },
    ownRow: {
      justifyContent: 'flex-end'
    },
    bubble: {
      maxWidth: '78%',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    ownBubble: {
      backgroundColor: theme.colors.accent,
      borderBottomRightRadius: 4
    },
    otherBubble: {
      backgroundColor: theme.colors.inputBackground,
      borderBottomLeftRadius: 4
    },
    text: {
      fontSize: 15,
      lineHeight: 20
    },
    ownText: {
      color: theme.colors.primaryText
    },
    otherText: {
      color: theme.colors.foreground
    },
    time: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end'
    },
    ownTime: {
      color: theme.colors.primaryText,
      opacity: 0.7
    },
    otherTime: {
      color: theme.colors.muted
    }
  });
}
