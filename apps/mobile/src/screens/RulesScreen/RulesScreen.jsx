import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { buildRulesChannel } from '@saintrocky/realtime';
import {
  Badge,
  EmptyState,
  RuleListItem,
  SectionHeader,
  useTheme
} from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { createStyles } from '@/screens/RulesScreen/RulesScreen.styles.js';

const FILTER_OPTIONS = ['all', 'active', 'inactive', 'draft'];

export function RulesScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [rules, setRules] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const ownerEmail = auth.user?.email;
  const rulesChannel = ownerEmail ? buildRulesChannel(ownerEmail) : null;

  useRealtimeChannel(rulesChannel, {
    onEvent() {
      loadData();
    }
  });

  const loadData = useCallback(async () => {
    try {
      const [rulesResult, draftsResult] = await Promise.all([
        api.rules.listRules(ownerEmail),
        api.rules.listDrafts(ownerEmail)
      ]);
      setRules(rulesResult.rules || []);
      setDrafts(draftsResult.drafts || []);
    } catch {}
  }, [ownerEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const combinedRules = useMemo(() => {
    const draftItems = drafts.map((draft) => ({
      ...draft,
      ruleId: draft.ruleDraftId,
      title: draft.title || draft.summary || 'AI Draft',
      status: 'draft',
      isDraft: true
    }));

    const allItems = [...rules, ...draftItems];

    if (activeFilter === 'all') return allItems;
    return allItems.filter((item) => item.status === activeFilter);
  }, [rules, drafts, activeFilter]);

  const counts = useMemo(() => ({
    all: rules.length + drafts.length,
    active: rules.filter((r) => r.status === 'active').length,
    inactive: rules.filter((r) => r.status === 'inactive').length,
    draft: drafts.length
  }), [rules, drafts]);

  const handleRulePress = useCallback((rule) => {
    navigation.navigate('RuleDetail', { rule });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((filter) => (
          <Badge
            key={filter}
            variant={activeFilter === filter ? 'primary' : 'default'}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={activeFilter === filter ? styles.filterActiveText : styles.filterText}
              onPress={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter] || 0})
            </Text>
          </Badge>
        ))}
      </View>

      <FlatList
        data={combinedRules}
        keyExtractor={(item) => item.ruleId || item.ruleDraftId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RuleListItem
            rule={item}
            onPress={() => handleRulePress(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            iconName="tactics"
            title="No rules yet"
            message="Create rules from the Strategy workspace on web, or browse templates to get started."
          />
        }
      />
    </View>
  );
}
