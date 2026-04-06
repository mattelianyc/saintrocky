import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { IconButton, Badge, useTheme } from '@saintrocky/ui-native';
import { TopNavBranding } from '@/components/TopNavBranding/TopNavBranding.jsx';
import { usePendingActionsOverlay } from '@/components/PendingActionsOverlay/PendingActionsOverlay.jsx';

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
  const { hasActivityAccess, pendingActionsCount, toggleSheet } = usePendingActionsOverlay();
  const hasCenteredCopy = Boolean(centerTitle || centerSubtitle);

  const handleLeftPress = () => {
    if (canGoBack) {
      navigation.goBack();
    } else if (showDrawerToggle) {
      navigation.dispatch(DrawerActions.toggleDrawer());
    }
  };

  const leftIconName = canGoBack ? 'arrowLeft' : 'menu';
  const activityAccessibilityLabel = `Live activity${pendingActionsCount > 0 ? `, ${pendingActionsCount} pending` : ''}`;

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

        <View style={styles.centerSlot}>
          <TopNavBranding
            title={centerTitle}
            subtitle={centerSubtitle}
            onPress={!hasCenteredCopy && hasActivityAccess ? toggleSheet : undefined}
          />
        </View>

        <View style={styles.sideSlot}>
          {hasActivityAccess ? (
            <>
              <IconButton
                name="schedule"
                size={22}
                color={theme.colors.foreground}
                onPress={toggleSheet}
                accessibilityLabel={activityAccessibilityLabel}
              />
              {pendingActionsCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Badge variant="error" size="xs">
                    {pendingActionsCount > 99 ? '99+' : String(pendingActionsCount)}
                  </Badge>
                </View>
              )}
            </>
          ) : null}
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
