import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

export function MetricCard({ label, value, iconName, accentColor, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedAccent = accentColor || theme.colors.accent;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        {iconName ? (
          <View style={[styles.iconCircle, { backgroundColor: resolvedAccent + '1A' }]}>
            <Icon name={iconName} size={18} color={resolvedAccent} />
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value ?? '—'}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    header: {
      marginBottom: 10
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center'
    },
    value: {
      color: theme.colors.foreground,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 4
    },
    label: {
      color: theme.colors.muted,
      fontSize: 12,
      fontWeight: '500'
    }
  });
}
