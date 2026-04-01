import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildLeaderboardChannel } from '@saintrocky/realtime';
import { EmptyState, useTheme } from '@saintrocky/ui-native';

import { ScreenHeader } from '@/components/ScreenHeader/ScreenHeader.jsx';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { useRefreshControl } from '@/hooks/useRefreshControl.js';
import { LeaderboardScreenConfig } from '@/screens/LeaderboardScreen/LeaderboardScreen.config.js';
import { createStyles } from '@/screens/LeaderboardScreen/LeaderboardScreen.styles.js';

const MEDAL_EMOJI = { 1: '1ST', 2: '2ND', 3: '3RD' };
const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function LeaderboardEntry({ entry, index, isCurrentUser, theme, styles }) {
  const rank = entry.rank || index + 1;
  const isPodium = rank <= 3;
  const accentColor = isPodium ? PODIUM_COLORS[rank - 1] : theme.colors.foreground;

  return (
    <View style={[
      styles.entryRow,
      index % 2 === 1 && styles.entryRowAlt,
      isCurrentUser && styles.currentUserRow
    ]}>
      <View style={styles.rankCell}>
        <Text style={[styles.rankText, { color: accentColor }]}>
          {isPodium ? MEDAL_EMOJI[rank] : rank}
        </Text>
      </View>
      <View style={styles.entryBody}>
        <Text style={[styles.entryName, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
          {entry.displayName || entry.email || 'Anonymous'}
          {isCurrentUser ? '  ·  YOU' : ''}
        </Text>
        <Text style={styles.entryMeta}>
          {entry.activeRuleCount || 0} rules · {entry.complianceRate || 0}%
        </Text>
      </View>
      <Text style={[styles.scoreValue, isPodium && { color: accentColor }]}>
        {entry.disciplineScore ?? 0}
      </Text>
    </View>
  );
}

export function LeaderboardScreen({ auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth?.user?.id;

  useRealtimeChannel(buildLeaderboardChannel(), {
    onSnapshot(data) {
      if (Array.isArray(data?.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    },
    onEvent(payload) {
      if (payload?.leaderboard) {
        setLeaderboard(payload.leaderboard);
      }
    }
  });

  const load = useCallback(async () => {
    try {
      const result = await api.leaderboard.getLeaderboard(50);
      setLeaderboard(result.leaderboard || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load leaderboard.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { refreshing, onRefresh } = useRefreshControl(load);

  return (
    <View style={styles.container}>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader kicker="RANKINGS" title="Leaderboard" showLogo />
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.rankColumn]}>RANK</Text>
              <Text style={[styles.tableHeaderText, styles.nameColumn]}>PLAYER</Text>
              <Text style={[styles.tableHeaderText, styles.scoreColumn]}>SCORE</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <EmptyState
              iconName="trophy"
              title={LeaderboardScreenConfig.emptyTitle}
              message={LeaderboardScreenConfig.emptyMessage}
            />
          )
        }
      />
    </View>
  );
}
