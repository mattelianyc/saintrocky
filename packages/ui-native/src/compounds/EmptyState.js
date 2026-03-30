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
          <Icon name={iconName} size={40} color={theme.colors.muted} />
        </View>
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24
    },
    iconWrapper: {
      marginBottom: 16,
      opacity: 0.6
    },
    title: {
      color: theme.colors.foreground,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8
    },
    message: {
      color: theme.colors.muted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20
    },
    actions: {
      marginTop: 20
    }
  });
}
