import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@saintrocky/icons';
import { IconButton, useTheme } from '@saintrocky/ui-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

const SURFACE_LABELS = {
  chain: 'CHAIN',
  rules: 'RULES',
  social: 'SOCIAL',
  messages: 'MESSAGES',
  campaigns: 'CAMPAIGNS'
};

function formatRelativeTime(isoTimestamp) {
  const differenceMs = Date.now() - new Date(isoTimestamp).getTime();
  const seconds = Math.floor(differenceMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({ notification, theme, styles }) {
  const surfaceLabel = SURFACE_LABELS[notification.surface] || notification.surface?.toUpperCase();

  return (
    <View style={[styles.notificationItem, !notification.read && styles.notificationItemUnread]}>
      <View style={styles.notificationHeader}>
        <Text style={styles.surfaceTag}>{surfaceLabel}</Text>
        <Text style={styles.timestamp}>{formatRelativeTime(notification.timestamp)}</Text>
      </View>
      <Text style={styles.notificationTitle} numberOfLines={1}>{notification.title}</Text>
      {notification.body ? (
        <Text style={styles.notificationBody} numberOfLines={2}>{notification.body}</Text>
      ) : null}
    </View>
  );
}

export function NotificationSheet({
  visible,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTouchable} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT, paddingBottom: insets.bottom + 16, transform: [{ translateY }] }
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              NOTIFICATIONS{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
            <View style={styles.sheetActions}>
              {notifications.length > 0 && (
                <>
                  <IconButton
                    name="check"
                    size={18}
                    color={theme.colors.accent}
                    onPress={onMarkAllRead}
                    accessibilityLabel="Mark all as read"
                  />
                  <IconButton
                    name="close"
                    size={18}
                    color={theme.shell.textMuted}
                    onPress={onClearAll}
                    accessibilityLabel="Clear all notifications"
                  />
                </>
              )}
              <IconButton
                name="close"
                size={20}
                color={theme.colors.foreground}
                onPress={onClose}
                accessibilityLabel="Close notifications"
              />
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon
                name="notifications"
                size={36}
                color={theme.shell.textMuted}
              />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>
                Violations, rule events, and social activity will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationItem notification={item} theme={theme} styles={styles} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme) {
  const { typography, spacing } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end'
    },
    overlayTouchable: {
      flex: 1
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: spacing.xsmall
    },
    handleBar: {
      width: 36,
      height: 4,
      backgroundColor: theme.shell.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.small
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.small,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    sheetTitle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingUltraWide,
      color: theme.colors.foreground
    },
    sheetActions: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    listContent: {
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.xsmall
    },
    notificationItem: {
      paddingVertical: spacing.small,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    notificationItemUnread: {
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.accent,
      paddingLeft: spacing.small
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4
    },
    surfaceTag: {
      fontFamily: typography.fontFamilyMono,
      fontSize: 9,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.colors.accent
    },
    timestamp: {
      fontFamily: typography.fontFamilyMono,
      fontSize: 9,
      color: theme.shell.textMuted,
      letterSpacing: typography.letterSpacingWide
    },
    notificationTitle: {
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightSemibold,
      color: theme.colors.foreground,
      marginBottom: 2
    },
    notificationBody: {
      fontSize: typography.sizeSmall,
      color: theme.shell.textMuted,
      lineHeight: 18
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xlarge
    },
    emptyTitle: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeMedium,
      fontWeight: typography.weightBold,
      color: theme.colors.foreground,
      marginTop: spacing.medium,
      marginBottom: spacing.xsmall
    },
    emptyMessage: {
      fontSize: typography.sizeSmall,
      color: theme.shell.textMuted,
      textAlign: 'center',
      lineHeight: 20
    }
  });
}
