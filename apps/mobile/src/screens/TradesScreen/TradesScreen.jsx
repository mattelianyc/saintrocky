import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import { EmptyState, useTheme } from '@saintrocky/ui-native';
import { LoadingSkeleton } from '@/components/LoadingSkeleton/LoadingSkeleton.jsx';
import { useRefreshControl } from '@/hooks/useRefreshControl.js';
import { createStyles } from '@/screens/TradesScreen/TradesScreen.styles.js';

function formatTradeTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TradeRow({ trade, theme, styles }) {
  const isViolation = trade.isViolation;

  return (
    <View style={[styles.tradeRow, isViolation && styles.tradeRowViolation]}>
      <View style={styles.tradeLeft}>
        <View style={styles.tradeHeader}>
          <Text style={styles.tradeToken}>{trade.token || trade.symbol || '—'}</Text>
          <View style={[
            styles.sideTag,
            { backgroundColor: trade.side === 'buy' ? theme.colors.success + '20' : theme.colors.error + '20' }
          ]}>
            <Text style={[
              styles.sideTagText,
              { color: trade.side === 'buy' ? theme.colors.success : theme.colors.error }
            ]}>
              {(trade.side || '—').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.tradeMeta}>
          {trade.platform || '—'} · {formatTradeTime(trade.timestamp)}
        </Text>
        {trade.amountSol != null && (
          <Text style={styles.tradeAmount}>{Number(trade.amountSol).toFixed(4)} SOL</Text>
        )}
      </View>
      <View style={styles.tradeRight}>
        {isViolation ? (
          <View style={styles.violationIndicator}>
            <Text style={styles.violationText}>VIOLATION</Text>
          </View>
        ) : (
          <View style={styles.cleanIndicator} />
        )}
      </View>
    </View>
  );
}

export function TradesScreen({ auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWallets() {
      try {
        const result = await api.wallets.listWallets();
        const walletList = result.wallets || [];
        setWallets(walletList);
        if (walletList.length > 0) {
          setSelectedWallet(walletList[0].walletAddress);
        }
      } catch (error) {
        Alert.alert('Error', error?.message || 'Failed to load wallets.');
      }
      setLoading(false);
    }
    loadWallets();
  }, []);

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
    loadTrades();
  }, [loadTrades]);

  const { refreshing, onRefresh } = useRefreshControl(loadTrades);

  const violationCount = trades.filter((t) => t.isViolation).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={trades}
        keyExtractor={(item, index) => item.signature || String(index)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
        }
        ListHeaderComponent={
          <>
            {wallets.length > 1 && (
              <View style={styles.walletSelector}>
                {wallets.map((wallet) => (
                  <Pressable
                    key={wallet.walletAddress}
                    style={[
                      styles.walletPill,
                      selectedWallet === wallet.walletAddress && styles.walletPillActive
                    ]}
                    onPress={() => setSelectedWallet(wallet.walletAddress)}
                  >
                    <Text style={[
                      styles.walletPillText,
                      selectedWallet === wallet.walletAddress && styles.walletPillTextActive
                    ]}>
                      {wallet.label || `${wallet.walletAddress.slice(0, 6)}…${wallet.walletAddress.slice(-4)}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {trades.length > 0 && (
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{trades.length} TRADES</Text>
                <Text style={styles.statDivider}>·</Text>
                <Text style={[styles.statText, violationCount > 0 && { color: theme.colors.error }]}>
                  {violationCount} VIOLATION{violationCount !== 1 ? 'S' : ''}
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TradeRow trade={item} theme={theme} styles={styles} />
        )}
        ListEmptyComponent={
          loading ? (
            <LoadingSkeleton rows={8} />
          ) : (
            <EmptyState
              iconName="chart"
              title="No trades found"
              message={selectedWallet ? 'No recent trades for this wallet.' : 'Link a wallet to see your trade history.'}
            />
          )
        }
      />
    </View>
  );
}
