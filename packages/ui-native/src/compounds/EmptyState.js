import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

export function EmptyState({ iconName, title, message, children }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {iconName ? (
        <View style={styles.iconWrapper}>
          <Icon name={iconName} size={36} color={theme.shell?.textMuted || theme.colors.muted} />
        </View>
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing?.jumbo || 48,
      paddingHorizontal: spacing?.large || 24
    },
    iconWrapper: {
      marginBottom: spacing?.medium || 16,
      opacity: 0.4
    },
    title: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.foreground,
      fontSize: typography?.sizeMedium || 17,
      fontWeight: typography?.weightBold || '700',
      textAlign: 'center',
      letterSpacing: typography?.letterSpacingWide || 1.2,
      marginBottom: spacing?.xsmall || 8
    },
    message: {
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeSmall || 14,
      textAlign: 'center',
      lineHeight: 20
    },
    actions: {
      marginTop: spacing?.large || 20
    }
  });
}
