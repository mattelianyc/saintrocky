import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

const VARIANT_MAP = {
  default: (theme) => ({
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.foreground
  }),
  primary: (theme) => ({
    backgroundColor: theme.colors.primary,
    color: theme.colors.primaryText
  }),
  success: (theme) => ({
    backgroundColor: theme.colors.success,
    color: '#fff'
  }),
  warning: (theme) => ({
    backgroundColor: theme.colors.warning,
    color: '#fff'
  }),
  error: (theme) => ({
    backgroundColor: theme.colors.error,
    color: '#fff'
  }),
  muted: (theme) => ({
    backgroundColor: theme.colors.border,
    color: theme.colors.muted
  })
};

export function Badge({ children, variant = 'default', size = 'sm', style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const variantResolver = VARIANT_MAP[variant] || VARIANT_MAP.default;
  const variantStyles = variantResolver(theme);
  const sizeStyles = size === 'xs' ? styles.extraSmall : styles.small;

  return (
    <View style={[styles.badge, { backgroundColor: variantStyles.backgroundColor }, sizeStyles, style]}>
      <Text style={[styles.label, { color: variantStyles.color }, size === 'xs' && styles.extraSmallLabel]}>
        {children}
      </Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 6
    },
    small: {
      paddingHorizontal: 8,
      paddingVertical: 3
    },
    extraSmall: {
      paddingHorizontal: 6,
      paddingVertical: 2
    },
    label: {
      fontSize: 12,
      fontWeight: '600'
    },
    extraSmallLabel: {
      fontSize: 10
    }
  });
}
