import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { buildLeaderboardChannel } from '@saintrocky/realtime';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  useTheme
} from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { createStyles } from '@/screens/LeaderboardScreen/LeaderboardScreen.styles.js';

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function LeaderboardEntry({ entry, index, isCurrentUser, theme, styles }) {
  const rank = entry.rank || index + 1;
  const isPodium = rank <= 3;
  const podiumColor = isPodium ? PODIUM_COLORS[rank - 1] : null;

  return (
    <Card style={[styles.entryCard, isCurrentUser && styles.currentUserCard]}>
      <View style={styles.entryRow}>
        <View style={[
          styles.rankCircle,
          isPodium && { backgroundColor: podiumColor }
        ]}>
          <Text style={[styles.rankText, isPodium && styles.podiumRankText]}>
            {rank}
          </Text>
        </View>

        <Avatar
          name={entry.displayName}
          size="sm"
          color={isPodium ? podiumColor : undefined}
        />

        <View style={styles.entryBody}>
          <Text style={styles.entryName} numberOfLines={1}>
            {entry.displayName || entry.email || 'Anonymous'}
          </Text>
          <Text style={styles.entryMeta}>
            {entry.activeRuleCount || 0} rules · {entry.complianceRate || 0}% compliance
          </Text>
        </View>

        <View style={styles.scoreColumn}>
          <Text style={[styles.scoreValue, isPodium && { color: podiumColor }]}>
            {entry.disciplineScore ?? 0}
          </Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>

      {isCurrentUser ? (
        <Badge variant="primary" size="xs" style={styles.youBadge}>You</Badge>
      ) : null}
    </Card>
  );
}

export function LeaderboardScreen({ auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = auth?.user?.userId;

  useRealtimeChannel(buildLeaderboardChannel(), {
    onSnapshot(data) {
      if (Array.isArray(data?.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    },
    onEvent(message) {
      if (message?.data?.leaderboard) {
        setLeaderboard(message.data.leaderboard);
      }
    }
  });

  const load = useCallback(async () => {
    try {
      const result = await api.leaderboard.getLeaderboard(50);
      setLeaderboard(result.leaderboard || []);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <FlatList
      data={leaderboard}
      keyExtractor={(item) => item.userId}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <LeaderboardEntry
          entry={item}
          index={index}
          isCurrentUser={item.userId === currentUserId}
          theme={theme}
          styles={styles}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>
            Discipline scores updated in real time
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          iconName="trophy"
          title="No rankings yet"
          message="Activate rules and maintain compliance to earn your spot on the board."
        />
      }
    />
  );
}
