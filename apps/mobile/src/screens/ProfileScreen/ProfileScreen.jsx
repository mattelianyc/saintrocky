import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { saintRockyBranding } from '@saintrocky/branding';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ListItem,
  SectionHeader,
  useTheme
} from '@saintrocky/ui-native';

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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await api.wallets.listWallets();
      const walletList = result.wallets || [];
      setWallets(walletList);
      if (walletList.length > 0 && !selectedWallet) {
        setSelectedWallet(walletList[0].walletAddress);
      }
    } catch {}
  }, [selectedWallet]);

  const loadTrades = useCallback(async () => {
    if (!selectedWallet) return;
    try {
      const result = await api.chain.listRecentTrades(selectedWallet);
      setTrades(result.trades || []);
    } catch {}
  }, [selectedWallet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadTrades()]);
    setRefreshing(false);
  }, [loadData, loadTrades]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => auth.logout()
      }
    ]);
  }, [auth]);

  const totalEscrowLamports = wallets.reduce(
    (sum, w) => sum + (w.escrowBalanceLamports || 0),
    0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileHeader}>
        <Avatar
          name={auth.user?.displayName || auth.user?.email}
          size="xl"
        />
        <Text style={styles.displayName}>
          {auth.user?.displayName || auth.user?.email || '—'}
        </Text>
        <Text style={styles.email}>{auth.user?.email}</Text>
        {auth.user?.role ? (
          <Badge variant="default">{auth.user.role}</Badge>
        ) : null}
      </View>

      <SectionHeader title="Escrow Wallet" />
      <Card style={styles.walletCard}>
        <View style={styles.escrowRow}>
          <Text style={styles.escrowLabel}>Total escrow balance</Text>
          <Text style={styles.escrowValue}>{formatSol(totalEscrowLamports)} SOL</Text>
        </View>
      </Card>

      {wallets.length > 0 ? (
        <>
          <SectionHeader title={`Linked wallets (${wallets.length})`} />
          {wallets.map((wallet) => (
            <ListItem
              key={wallet.walletAddress}
              title={wallet.label || 'Wallet'}
              subtitle={shortenAddress(wallet.walletAddress)}
              onPress={() => setSelectedWallet(wallet.walletAddress)}
              trailing={
                <Text style={styles.walletBalance}>
                  {formatSol(wallet.escrowBalanceLamports)} SOL
                </Text>
              }
            />
          ))}
        </>
      ) : (
        <EmptyState
          iconName="wallet"
          message="No wallets linked. Connect a wallet on the web dashboard."
        />
      )}

      {trades.length > 0 ? (
        <>
          <SectionHeader title="Recent trades" />
          <Card style={styles.tradesCard}>
            {trades.slice(0, 8).map((trade, index) => (
              <View key={trade.signature || index} style={styles.tradeRow}>
                <View style={styles.tradeInfo}>
                  <Text style={styles.tradeToken}>
                    {trade.token || trade.symbol || '—'}
                  </Text>
                  <Text style={styles.tradeMeta}>
                    {trade.side || '—'} · {trade.platform || '—'}
                  </Text>
                </View>
                <View style={styles.tradeStatus}>
                  <Badge
                    variant={trade.isViolation ? 'error' : 'success'}
                    size="xs"
                  >
                    {trade.isViolation ? 'Violation' : 'Clean'}
                  </Badge>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Settings" />
      <ListItem
        title="Appearance"
        subtitle={`${theme.mode === 'dark' ? 'Dark' : 'Light'} mode`}
        onPress={toggleTheme}
        showChevron
      />

      <View style={styles.logoutSection}>
        <Button
          variant="outline"
          leadingIconName="logout"
          onPress={handleLogout}
        >
          Sign out
        </Button>
        <Text style={styles.versionText}>
          {saintRockyBranding.productName} v0.1.0
        </Text>
      </View>
    </ScrollView>
  );
}
