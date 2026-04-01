import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '@saintrocky/ui-native';

const TAB_ICONS = {
  Home: 'home',
  Rules: 'tactics',
  Social: 'users',
  Leaderboard: 'trophy',
  Profile: 'user'
};

export function CustomTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom || 8, backgroundColor: theme.colors.background }
    ]}>
      <View style={styles.divider} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] || 'home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={styles.tabContent}>
                <Icon
                  name={iconName}
                  size={22}
                  color={isFocused ? theme.colors.accent : theme.shell.textMuted}
                />
                {isFocused && <View style={[styles.indicator, { backgroundColor: theme.colors.accent }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      paddingTop: 0
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.shell.border
    },
    tabRow: {
      flexDirection: 'row',
      paddingTop: 12
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    },
    indicator: {
      width: 16,
      height: 2
    }
  });
}
