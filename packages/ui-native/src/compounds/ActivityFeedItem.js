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
  const iconColor = isWarning ? theme.colors.error : theme.colors.accent;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: iconColor + '1A' }]}>
        <Icon name={config.icon} size={16} color={iconColor} />
      </View>
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
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border
    },
    iconCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10
    },
    body: {
      flex: 1
    },
    label: {
      color: theme.colors.foreground,
      fontSize: 14,
      fontWeight: '600'
    },
    summary: {
      color: theme.colors.muted,
      fontSize: 12,
      marginTop: 2
    },
    time: {
      color: theme.colors.muted,
      fontSize: 11,
      marginLeft: 8
    }
  });
}
