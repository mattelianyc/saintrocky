import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { Card, useTheme } from '@saintrocky/ui-native';

function RuleRow({ rule, theme }) {
  const statusColor = rule.status === 'active'
    ? theme.colors.success
    : theme.colors.mutedForeground;

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: '600', flex: 1 }}>
          {rule.title || rule.summary}
        </Text>
        <View style={{
          backgroundColor: statusColor,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 4
        }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{rule.status}</Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.mutedForeground, marginTop: 4, fontSize: 13 }}>
        {rule.summary}
      </Text>
    </Card>
  );
}

export function RulesScreen({ auth }) {
  const { theme } = useTheme();
  const [rules, setRules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const result = await api.rules.listRules(auth.user?.email);
      setRules(result.rules || []);
    } catch {}
  }, [auth.user?.email]);

  useEffect(() => { loadRules(); }, [loadRules]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRules();
    setRefreshing(false);
  }, [loadRules]);

  return (
    <FlatList
      data={rules}
      keyExtractor={(item) => item.ruleId}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => <RuleRow rule={item} theme={theme} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 40 }}>
          No rules configured yet.
        </Text>
      }
    />
  );
}
