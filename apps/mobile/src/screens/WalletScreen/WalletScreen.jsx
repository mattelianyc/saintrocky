import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import { Card, useTheme } from '@saintrocky/ui-native';

function WalletRow({ wallet, theme }) {
  const balanceSol = (wallet.escrowBalanceLamports || 0) / 1_000_000_000;
  const shortAddress = `${wallet.walletAddress.slice(0, 6)}...${wallet.walletAddress.slice(-4)}`;

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>
            {wallet.label || 'Wallet'}
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 12 }}>
            {shortAddress}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.colors.accent, fontWeight: '700', fontSize: 16 }}>
            {balanceSol.toFixed(3)} SOL
          </Text>
          <Text style={{ color: theme.colors.mutedForeground, fontSize: 11 }}>
            Escrow
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function WalletScreen() {
  const { theme } = useTheme();
  const [wallets, setWallets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api.wallets.listWallets();
      setWallets(result.wallets || []);
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
      data={wallets}
      keyExtractor={(item) => item.walletAddress}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => <WalletRow wallet={item} theme={theme} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 40 }}>
          No wallets linked. Connect a wallet on the web app.
        </Text>
      }
    />
  );
}
