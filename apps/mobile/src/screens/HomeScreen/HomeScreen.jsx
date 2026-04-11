import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { saintRockyBranding } from '@saintrocky/branding';
import {
  Button,
  MetricCard,
  EmptyState,
  useTheme
} from '@saintrocky/ui-native';

import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { useRefreshControl } from '@/hooks/useRefreshControl.js';
import { HomeScreenConfig } from '@/screens/HomeScreen/HomeScreen.config.js';
import { createStyles } from '@/screens/HomeScreen/HomeScreen.styles.js';

export function HomeScreen({ auth, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await api.dashboard.summary();
      setSummary(result);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load dashboard.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const { refreshing, onRefresh } = useRefreshControl(loadDashboard);

  const counts = summary?.counts;
  const stats = summary?.stats;

  const disciplineScore = counts?.disciplineScore ?? '—';
  const escrowBalance = counts?.escrowBalanceSol != null
    ? `${Number(counts.escrowBalanceSol).toFixed(2)}`
    : '—';
  const activeRulesCount = counts?.activeRules ?? '—';
  const violationsCount = counts?.recentViolations ?? '—';
  const hasRecentViolations = Number(counts?.recentViolations ?? 0) > 0;

  const complianceRate = stats?.complianceRate != null
    ? `${Number(stats.complianceRate).toFixed(1)}%`
    : '—';
  const cleanStreak = stats?.cleanStreak ?? '—';
  const totalTrades = stats?.totalTrades ?? '—';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
      }
    >
      
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <View style={styles.metricsGrid}>
            <MetricCard label="DISCIPLINE" value={disciplineScore} accentColor={theme.colors.accent} />
            <MetricCard label="ESCROW SOL" value={escrowBalance} accentColor={theme.colors.warning} />
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard label="ACTIVE RULES" value={activeRulesCount} accentColor={theme.colors.success} />
            <MetricCard label="VIOLATIONS" value={violationsCount} accentColor={theme.colors.error} />
          </View>

          <Text style={styles.sectionKicker}>PERFORMANCE</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label="COMPLIANCE" value={complianceRate} accentColor={theme.colors.accent} />
            <MetricCard label="CLEAN STREAK" value={cleanStreak} accentColor={theme.colors.success} />
          </View>
          <View style={styles.metricsGrid}>
            <MetricCard label="TOTAL TRADES" value={totalTrades} accentColor={theme.colors.foreground} />
            <MetricCard
              label="WALLETS"
              value={stats?.walletCount ?? '—'}
              accentColor={theme.colors.foreground}
            />
          </View>

          <View style={styles.tradeLink}>
            <Button
              variant="ghost"
              size="sm"
              leadingIconName="chart"
              onPress={() => navigation.navigate('Trades')}
            >
              View trade history
            </Button>
          </View>

          {!hasRecentViolations && (
            <EmptyState
              iconName="check"
              title={HomeScreenConfig.emptyActivityTitle}
              message={HomeScreenConfig.emptyActivityMessage}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}
