import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme.js';

export function SectionDivider({ style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.divider, style]} />;
}

function createStyles(theme) {
  return StyleSheet.create({
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.shell?.border || theme.colors.border,
      marginVertical: theme.spacing?.small || 12
    }
  });
}
