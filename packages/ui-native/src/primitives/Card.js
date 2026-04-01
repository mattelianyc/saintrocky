import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme.js';

export function Card({ children, style, ...props }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 2,
      padding: theme.spacing?.medium || 16,
      backgroundColor: theme.shell?.backgroundSoft || theme.colors.card
    }
  });
}
