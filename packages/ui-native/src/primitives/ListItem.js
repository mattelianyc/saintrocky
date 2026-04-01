import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  showChevron = false,
  style
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = (
    <View style={[styles.container, style]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {showChevron ? (
        <View style={styles.chevron}>
          <Icon name="chevronRight" size={16} color={theme.shell?.textMuted || theme.colors.muted} />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed ? { opacity: 0.7 } : null}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing?.small || 12,
      paddingHorizontal: spacing?.medium || 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell?.border || theme.colors.border
    },
    leading: {
      marginRight: spacing?.small || 12
    },
    body: {
      flex: 1
    },
    title: {
      color: theme.colors.foreground,
      fontSize: typography?.sizeBase || 15,
      fontWeight: typography?.weightSemibold || '600'
    },
    subtitle: {
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeSmall || 13,
      marginTop: 2
    },
    trailing: {
      marginLeft: spacing?.small || 12
    },
    chevron: {
      marginLeft: spacing?.xsmall || 8
    }
  });
}
