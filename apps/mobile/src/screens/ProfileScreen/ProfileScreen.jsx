import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';

import { api } from '@/api/client.js';
import { saintRockyBranding } from '@saintrocky/branding';
import {
  Avatar,
  Button,
  EmptyState,
  MetricCard,
  useTheme
} from '@saintrocky/ui-native';

import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { useRefreshControl } from '@/hooks/useRefreshControl.js';
import { ProfileScreenConfig } from '@/screens/ProfileScreen/ProfileScreen.config.js';
import { createStyles } from '@/screens/ProfileScreen/ProfileScreen.styles.js';

function formatSol(lamports) {
  return ((Number(lamports) || 0) / 1_000_000_000).toFixed(3);
}

function shortenAddress(address) {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ProfileScreen({ auth }) {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [wallets, setWallets] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await api.wallets.listWallets();
      setWallets(result.wallets || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load profile data.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].walletAddress);
    }
  }, [wallets, selectedWallet]);

  const loadTrades = useCallback(async () => {
    if (!selectedWallet) return;
    try {
      const result = await api.chain.listRecentTrades(selectedWallet);
      setTrades(result.trades || []);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load trades.');
    }
  }, [selectedWallet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadData(), loadTrades()]);
  }, [loadData, loadTrades]);

  const { refreshing, onRefresh } = useRefreshControl(loadAll);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => auth.logout() }
    ]);
  }, [auth]);

  const totalEscrowLamports = wallets.reduce(
    (sum, wallet) => sum + (wallet.escrowBalanceLamports || 0),
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
      }
    >
      <View style={styles.profileHeader}>
        <Avatar name={auth.user?.displayName || auth.user?.email} size="xl" />
        <Text style={styles.displayName}>
          {auth.user?.displayName || auth.user?.email || '—'}
        </Text>
        <Text style={styles.email}>{auth.user?.email}</Text>
        {auth.user?.role && (
          <Text style={styles.roleBadge}>{auth.user.role.toUpperCase()}</Text>
        )}
      </View>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <View style={styles.escrowMetrics}>
            <MetricCard
              label="ESCROW BAL"
              value={`${formatSol(totalEscrowLamports)}`}
              accentColor={theme.colors.accent}
            />
            <MetricCard
              label="WALLETS"
              value={wallets.length}
              accentColor={theme.colors.warning}
            />
          </View>
        </>
      )}

      {!loading && wallets.length > 0 ? (
        <>
          <Text style={styles.sectionKicker}>LINKED WALLETS</Text>
          {wallets.map((wallet) => (
            <Pressable
              key={wallet.walletAddress}
              style={({ pressed }) => [styles.walletRow, pressed && styles.pressed]}
              onPress={() => setSelectedWallet(wallet.walletAddress)}
            >
              <View>
                <Text style={styles.walletLabel}>{wallet.label || 'Wallet'}</Text>
                <Text style={styles.walletAddress}>{shortenAddress(wallet.walletAddress)}</Text>
              </View>
              <View style={styles.walletRight}>
                <Text style={styles.walletBalance}>{formatSol(wallet.escrowBalanceLamports)} SOL</Text>
                {selectedWallet === wallet.walletAddress && (
                  <View style={styles.selectedDot} />
                )}
              </View>
            </Pressable>
          ))}
        </>
      ) : !loading ? (
        <EmptyState
          iconName="wallet"
          message={ProfileScreenConfig.emptyWalletsMessage}
        />
      ) : null}

      {trades.length > 0 && (
        <>
          <Text style={styles.sectionKicker}>RECENT TRADES</Text>
          {trades.slice(0, 8).map((trade, index) => (
            <View key={trade.signature || index} style={styles.tradeRow}>
              <View style={styles.tradeInfo}>
                <Text style={styles.tradeToken}>{trade.token || trade.symbol || '—'}</Text>
                <Text style={styles.tradeMeta}>
                  {trade.side || '—'} · {trade.platform || '—'}
                </Text>
              </View>
              <View style={[
                styles.tradeDot,
                { backgroundColor: trade.isViolation ? theme.colors.error : theme.colors.success }
              ]} />
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionKicker}>SETTINGS</Text>
      <Pressable
        style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
        onPress={toggleTheme}
      >
        <View>
          <Text style={styles.settingsLabel}>Appearance</Text>
          <Text style={styles.settingsValue}>
            {theme.mode === 'dark' ? 'Dark' : 'Light'} mode
          </Text>
        </View>
        <Icon name="chevronRight" size={16} color={theme.shell.textMuted} />
      </Pressable>

      <View style={styles.logoutSection}>
        <Button variant="ghost" leadingIconName="logout" onPress={handleLogout}>
          Sign out
        </Button>
        <Text style={styles.versionText}>
          {saintRockyBranding.productName} · v0.1.0
        </Text>
      </View>
    </ScrollView>
  );
}
