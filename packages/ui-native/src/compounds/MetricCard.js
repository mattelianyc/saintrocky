import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

export function MetricCard({ label, value, accentColor, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedAccent = accentColor || theme.colors.accent;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: resolvedAccent }]}>{value ?? '—'}</Text>
    </View>
  );
}

function createStyles(theme) {
  const { typography } = theme;

  return StyleSheet.create({
    container: {
      flex: 1
    },
    label: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXxsmall || 10,
      fontWeight: typography?.weightMedium || '500',
      textTransform: 'uppercase',
      letterSpacing: typography?.letterSpacingUltraWide || 3.0,
      marginBottom: 2
    },
    value: {
      fontSize: typography?.sizeJumbo || 40,
      fontWeight: typography?.weightBlack || '900',
      letterSpacing: typography?.letterSpacingTight || -0.4
    }
  });
}
