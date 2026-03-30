import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { saintRockyBranding } from '@saintrocky/branding';
import {
  MetricCard,
  SectionHeader,
  ViolationCard,
  ActivityFeedItem,
  EmptyState,
  useTheme
} from '@saintrocky/ui-native';

import { useViolationAlerts } from '@/hooks/useViolationAlerts.js';
import { createStyles } from '@/screens/HomeScreen/HomeScreen.styles.js';

export function HomeScreen({ auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [summary, setSummary] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const ownerEmail = auth.user?.email;
  const { violations, loading: violationLoading, comply, bypass } =
    useViolationAlerts(ownerEmail);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await api.dashboard.summary();
      setSummary(result);
      setRecentEvents(result.recentEvents || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const disciplineScore = summary?.disciplineScore ?? '—';
  const escrowBalance = summary?.escrowBalanceSol != null
    ? `${Number(summary.escrowBalanceSol).toFixed(2)}`
    : '—';
  const activeRulesCount = summary?.activeRuleCount ?? '—';
  const violationsCount = summary?.recentViolationCount ?? violations.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingName}>
          {auth.user?.displayName || auth.user?.email || saintRockyBranding.shortProductName}
        </Text>
        <Text style={styles.greetingSubtitle}>Command center</Text>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          label="Discipline"
          value={disciplineScore}
          iconName="shield"
          accentColor={theme.colors.accent}
        />
        <View style={styles.metricSpacer} />
        <MetricCard
          label="Escrow (SOL)"
          value={escrowBalance}
          iconName="wallet"
          accentColor={theme.colors.warning}
        />
      </View>
      <View style={styles.metricsRow}>
        <MetricCard
          label="Active rules"
          value={activeRulesCount}
          iconName="tactics"
          accentColor={theme.colors.success}
        />
        <View style={styles.metricSpacer} />
        <MetricCard
          label="Violations"
          value={violationsCount}
          iconName="warning"
          accentColor={theme.colors.error}
        />
      </View>

      {violations.length > 0 ? (
        <>
          <SectionHeader title="Active Violations" />
          {violations.map((violation) => (
            <View key={violation.ruleId} style={styles.violationWrapper}>
              <ViolationCard
                violation={violation}
                onComply={() => comply(violation)}
                onBypass={() => bypass(violation)}
                loading={violationLoading}
              />
            </View>
          ))}
        </>
      ) : null}

      <SectionHeader title="Recent Activity" />
      {recentEvents.length > 0 ? (
        <View style={styles.activityList}>
          {recentEvents.slice(0, 10).map((event, index) => (
            <ActivityFeedItem key={event.eventId || index} event={event} />
          ))}
        </View>
      ) : (
        <EmptyState
          iconName="check"
          title="All clear"
          message="No recent activity. Your rules are being enforced across your runtimes."
        />
      )}
    </ScrollView>
  );
}
