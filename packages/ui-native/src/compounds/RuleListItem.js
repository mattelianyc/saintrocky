import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';

const STATUS_DOT_COLORS = {
  active: '#4ade80',
  inactive: 'rgba(255,255,255,0.25)',
  draft: '#fbbf24',
  pending_review: '#fbbf24'
};

export function RuleListItem({ rule, onPress }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dotColor = STATUS_DOT_COLORS[rule?.status] || theme.shell?.textMuted || theme.colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {rule?.title || rule?.summary || 'Untitled rule'}
        </Text>
        {rule?.summary ? (
          <Text style={styles.summary} numberOfLines={1}>{rule.summary}</Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {rule?.status || 'unknown'}
          </Text>
          {rule?.enforcementSurfaces?.length ? (
            <Text style={styles.metaText}>
              · {rule.enforcementSurfaces.length} surface{rule.enforcementSurfaces.length !== 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
      </View>
      <Icon name="chevronRight" size={16} color={theme.shell?.textMuted || theme.colors.muted} />
    </Pressable>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing?.medium || 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell?.border || theme.colors.border
    },
    pressed: {
      opacity: 0.7
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing?.small || 12
    },
    body: {
      flex: 1,
      marginRight: spacing?.xsmall || 8
    },
    title: {
      color: theme.colors.foreground,
      fontSize: typography?.sizeBase || 15,
      fontWeight: typography?.weightSemibold || '600'
    },
    summary: {
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeSmall || 13,
      lineHeight: 18,
      marginTop: 2
    },
    meta: {
      flexDirection: 'row',
      marginTop: 4
    },
    metaText: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXxsmall || 10,
      letterSpacing: typography?.letterSpacingWide || 1.2,
      textTransform: 'uppercase'
    }
  });
}
