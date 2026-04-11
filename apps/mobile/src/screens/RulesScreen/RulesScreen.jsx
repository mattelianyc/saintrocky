import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildRulesChannel } from '@saintrocky/realtime';
import { Button, EmptyState, RuleListItem, useTheme } from '@saintrocky/ui-native';

import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { useRefreshControl } from '@/hooks/useRefreshControl.js';
import { RulesScreenConfig } from '@/screens/RulesScreen/RulesScreen.config.js';
import { createStyles } from '@/screens/RulesScreen/RulesScreen.styles.js';

const FILTER_OPTIONS = ['active', 'inactive'];

export function RulesScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [rules, setRules] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);

  const ownerEmail = auth.user?.email;
  const rulesChannel = ownerEmail ? buildRulesChannel(ownerEmail) : null;

  useRealtimeChannel(rulesChannel, {
    onEvent() {
      loadData();
    }
  });

  const loadData = useCallback(async () => {
    try {
      const rulesResult = await api.rules.listRules(ownerEmail);
      setRules(rulesResult.rules || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load rules.');
    }
    setLoading(false);
  }, [ownerEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { refreshing, onRefresh } = useRefreshControl(loadData);

  const combinedRules = useMemo(() => {
    if (selectedFilters.length === 0) return rules;
    return rules.filter((item) => selectedFilters.includes(item.status));
  }, [rules, selectedFilters]);

  const counts = useMemo(() => ({
    active: rules.filter((r) => r.status === 'active').length,
    inactive: rules.filter((r) => r.status === 'inactive').length
  }), [rules]);

  const toggleFilter = useCallback((filter) => {
    setSelectedFilters((currentFilters) => {
      if (currentFilters.includes(filter)) {
        return currentFilters.filter((currentFilter) => currentFilter !== filter);
      }
      return [...currentFilters, filter];
    });
  }, []);

  const handleRulePress = useCallback((rule) => {
    navigation.navigate('RuleDetail', { rule });
  }, [navigation]);

  const handleManageOnWeb = useCallback(() => {
    Linking.openURL('https://www.thestandard.dev/dashboard').catch(() => {
      Alert.alert('Error', 'Could not open the web dashboard.');
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topActionRow}>
        <Button
          variant="ghost"
          size="sm"
          leadingIconName="link"
          onPress={handleManageOnWeb}
        >
          Manage on web
        </Button>
      </View>

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((filter) => {
          const isActive = selectedFilters.includes(filter);
          return (
            <Pressable
              key={filter}
              onPress={() => toggleFilter(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter} ({counts[filter] || 0})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="tactics"
              title={RulesScreenConfig.emptyTitle}
              message={RulesScreenConfig.emptyMessage}
            />
          }
        />
      )}
    </View>
  );
}
