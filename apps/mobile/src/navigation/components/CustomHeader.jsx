import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { IconButton, Badge, useTheme } from '@saintrocky/ui-native';
import { useNotificationContext } from '@/context/NotificationContext.jsx';
import { TopNavBranding } from '@/components/TopNavBranding/TopNavBranding.jsx';

export function CustomHeader({
  centerTitle,
  centerSubtitle,
  canGoBack = false,
  showDrawerToggle = true
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { unreadCount, toggleSheet } = useNotificationContext();

  const handleLeftPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else if (showDrawerToggle) {
      navigation.dispatch(DrawerActions.toggleDrawer());
    }
  };

  const leftIconName = canGoBack ? 'arrowLeft' : 'menu';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.sideSlot}>
          <IconButton
            name={leftIconName}
            size={22}
            color={theme.colors.foreground}
            onPress={handleLeftPress}
            accessibilityLabel={canGoBack ? 'Go back' : 'Open menu'}
            style={styles.leftButton}
          />
        </View>

        <View style={styles.centerSlot} pointerEvents="none">
          <TopNavBranding
            title={centerTitle}
            subtitle={centerSubtitle}
          />
        </View>

        <View style={styles.sideSlot}>
          <IconButton
            name="notifications"
            size={22}
            color={theme.colors.foreground}
            onPress={toggleSheet}
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Badge variant="error" size="xs">
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Badge>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { spacing } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 72,
      paddingHorizontal: spacing.xxsmall,
      paddingBottom: spacing.xsmall
    },
    sideSlot: {
      width: 48,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center'
    },
    leftButton: {
      padding: 8
    },
    centerSlot: {
      flex: 1,
      paddingHorizontal: spacing.small
    },
    badgeContainer: {
      position: 'absolute',
      top: 4,
      right: 4
    }
  });
}
