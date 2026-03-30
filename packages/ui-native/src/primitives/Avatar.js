import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

const SIZE_MAP = {
  sm: { container: 28, fontSize: 12 },
  md: { container: 36, fontSize: 14 },
  lg: { container: 48, fontSize: 18 },
  xl: { container: 64, fontSize: 24 }
};

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function Avatar({ name, size = 'md', color, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const backgroundColor = color || theme.colors.accent;

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: sizeConfig.container / 2,
          backgroundColor
        },
        style
      ]}
    >
      <Text style={[styles.initials, { fontSize: sizeConfig.fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    initials: {
      color: theme.colors.primaryText,
      fontWeight: '700'
    }
  });
}
