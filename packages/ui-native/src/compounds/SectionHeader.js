import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme.js';

export function SectionHeader({ title, trailing, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {trailing || null}
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing?.medium || 16,
      paddingTop: spacing?.xlarge || 24,
      paddingBottom: spacing?.xsmall || 8
    },
    title: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.accent || theme.colors.primary,
      fontSize: typography?.sizeXxsmall || 10,
      fontWeight: typography?.weightSemibold || '600',
      textTransform: 'uppercase',
      letterSpacing: typography?.letterSpacingUltraWide || 3.0
    }
  });
}
