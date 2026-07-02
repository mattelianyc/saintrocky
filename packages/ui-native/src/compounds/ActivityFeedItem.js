import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

const EVENT_CONFIG = {
  rule_triggered: { icon: 'warning', label: 'Rule triggered' },
  rule_complied: { icon: 'check', label: 'Complied' },
  bypass_offered: { icon: 'wallet', label: 'Bypass offered' },
  bypass_confirmed: { icon: 'trades', label: 'Bypass paid' },
  bypass_cancelled: { icon: 'close', label: 'Bypass cancelled' },
  rule_activated: { icon: 'activate', label: 'Rule activated' },
  rule_deactivated: { icon: 'pause', label: 'Rule deactivated' },
  friend_request: { icon: 'users', label: 'Friend request' },
  message_received: { icon: 'chat', label: 'New message' },
  campaign_joined: { icon: 'calendar', label: 'Joined campaign' }
};

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMinutes = Math.floor((now - then) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ActivityFeedItem({ event }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const config = EVENT_CONFIG[event?.eventType] || { icon: 'info', label: event?.eventType || 'Event' };
  const isWarning = event?.eventType === 'rule_triggered' || event?.eventType === 'bypass_offered';
  const dotColor = isWarning ? theme.colors.error : theme.colors.accent;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.body}>
        <Text style={styles.label}>{config.label}</Text>
        {event?.ruleSummary ? (
          <Text style={styles.summary} numberOfLines={1}>{event.ruleSummary}</Text>
        ) : null}
      </View>
      <Text style={styles.time}>{formatRelativeTime(event?.createdAt)}</Text>
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing?.small || 10,
      paddingHorizontal: spacing?.medium || 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell?.border || theme.colors.border
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing?.small || 12
    },
    body: {
      flex: 1
    },
    label: {
      color: theme.colors.foreground,
      fontSize: typography?.sizeBase || 14,
      fontWeight: typography?.weightSemibold || '600'
    },
    summary: {
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXsmall || 12,
      marginTop: 2
    },
    time: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXxsmall || 10,
      letterSpacing: typography?.letterSpacingWide || 1.2,
      marginLeft: spacing?.xsmall || 8
    }
  });
}
