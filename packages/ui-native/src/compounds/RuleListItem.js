import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { useTheme } from '../theme.js';
import { Badge } from '../primitives/Badge.js';

const STATUS_VARIANT_MAP = {
  active: 'success',
  inactive: 'muted',
  draft: 'warning',
  pending_review: 'warning'
};

export function RuleListItem({ rule, onPress }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const badgeVariant = STATUS_VARIANT_MAP[rule?.status] || 'default';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {rule?.title || rule?.summary || 'Untitled rule'}
        </Text>
        <Badge variant={badgeVariant} size="xs">
          {rule?.status || 'unknown'}
        </Badge>
      </View>

      {rule?.summary ? (
        <Text style={styles.summary} numberOfLines={2}>{rule.summary}</Text>
      ) : null}

      <View style={styles.meta}>
        {rule?.enforcementSurfaces?.length ? (
          <View style={styles.metaItem}>
            <Icon name="shield" size={12} color={theme.colors.muted} />
            <Text style={styles.metaText}>
              {rule.enforcementSurfaces.join(', ')}
            </Text>
          </View>
        ) : null}
        {rule?.scheduleType ? (
          <View style={styles.metaItem}>
            <Icon name="schedule" size={12} color={theme.colors.muted} />
            <Text style={styles.metaText}>{rule.scheduleType}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chevron}>
        <Icon name="chevronRight" size={18} color={theme.colors.muted} />
      </View>
    </Pressable>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      borderRadius: 14,
      padding: 14,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
      position: 'relative'
    },
    pressed: {
      opacity: 0.8
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    title: {
      color: theme.colors.foreground,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
      marginRight: 10
    },
    summary: {
      color: theme.colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8
    },
    meta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    metaText: {
      color: theme.colors.muted,
      fontSize: 11
    },
    chevron: {
      position: 'absolute',
      right: 12,
      top: '50%'
    }
  });
}
