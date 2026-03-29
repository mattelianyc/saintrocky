import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { Card, useTheme } from '@saintrocky/ui-native';

function LeaderboardRow({ entry, theme }) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: theme.colors.accent,
          justifyContent: 'center', alignItems: 'center', marginRight: 12
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            {entry.rank}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>
            {entry.displayName}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
            {entry.activeRuleCount} rules · {entry.complianceRate}% compliance
          </Text>
        </View>
        <Text style={{ color: theme.colors.accent, fontWeight: '700', fontSize: 18 }}>
          {entry.disciplineScore}
        </Text>
      </View>
    </Card>
  );
}

export function LeaderboardScreen() {
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.leaderboard.getLeaderboard(50);
      setLeaderboard(result.leaderboard || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <FlatList
      data={leaderboard}
      keyExtractor={(item) => item.userId}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => <LeaderboardRow entry={item} theme={theme} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 40 }}>
          No leaderboard data yet.
        </Text>
      }
    />
  );
}
