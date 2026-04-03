import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@saintrocky/icons';
import { Avatar, useTheme } from '@saintrocky/ui-native';
import { saintRockyBranding } from '@saintrocky/branding';
import { brandImages } from '@/assets/images.js';

const DRAWER_NAV_ITEMS = [
  { route: 'Home', icon: 'home', label: 'Home' },
  { route: 'Rules', icon: 'tactics', label: 'Rules' },
  { route: 'Social', icon: 'users', label: 'Social' },
  { route: 'Leaderboard', icon: 'trophy', label: 'Leaderboard' },
  { route: 'Profile', icon: 'user', label: 'Profile' }
];

export function DrawerContent({ navigation, auth, toggleTheme }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const user = auth?.user;
  const initials = user?.displayName
    ? user.displayName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const handleNavigation = (routeName) => {
    navigation.navigate('MainTabs', { screen: routeName });
    navigation.closeDrawer();
  };

  const handleLogout = async () => {
    navigation.closeDrawer();
    await auth?.logout?.();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandHeader}>
          <Image source={brandImages.roccoIcon} style={styles.logo} resizeMode="cover" />
          <Text style={styles.brandName}>{saintRockyBranding.shortProductName}</Text>
        </View>

        {user && (
          <View style={styles.userSection}>
            <Avatar size={48} initials={initials} />
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.displayName || user.email}
              </Text>
              {user.displayName && (
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.navSection}>
          {DRAWER_NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.navItem}
              onPress={() => handleNavigation(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Icon name={item.icon} size={20} color={theme.shell.textMuted} />
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.navSection}>
          {toggleTheme && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={toggleTheme}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
            >
              <Icon name="settings" size={20} color={theme.shell.textMuted} />
              <Text style={styles.navLabel}>
                {theme.mode === 'dark' ? 'Light mode' : 'Dark mode'}
              </Text>
            </TouchableOpacity>
          )}
          {auth?.logout && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Icon name="logout" size={20} color={theme.colors.error} />
              <Text style={[styles.navLabel, { color: theme.colors.error }]}>Sign out</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerVersion}>v0.1.0</Text>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { typography, spacing } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    scrollArea: {
      flex: 1
    },
    scrollContent: {
      paddingHorizontal: spacing.medium
    },
    brandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
      marginBottom: spacing.xlarge
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 12
    },
    brandName: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      color: theme.shell.textMuted,
      textTransform: 'uppercase'
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
      marginBottom: spacing.large
    },
    userInfo: {
      flex: 1
    },
    userName: {
      fontSize: typography.sizeMedium,
      fontWeight: typography.weightBold,
      color: theme.colors.foreground
    },
    userEmail: {
      fontSize: typography.sizeSmall,
      color: theme.shell.textMuted,
      marginTop: 2
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.shell.border,
      marginVertical: spacing.medium
    },
    navSection: {
      gap: spacing.xxsmall
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.xsmall
    },
    navLabel: {
      fontSize: typography.sizeBase,
      fontWeight: typography.weightMedium,
      color: theme.colors.foreground
    },
    footer: {
      paddingHorizontal: spacing.medium,
      paddingTop: spacing.small
    },
    footerVersion: {
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXxsmall,
      color: theme.shell.textMuted,
      letterSpacing: typography.letterSpacingWide
    }
  });
}
