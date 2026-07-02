import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { buildRulesChannel, buildRuntimeChannel } from '@saintrocky/realtime';
import { api } from '@/api/client.js';
import { useRealtimeChannel } from './useRealtimeChannel.js';

export function useViolationAlerts(ownerEmail) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const rulesChannel = ownerEmail ? buildRulesChannel(ownerEmail) : null;
  const runtimeChannel = ownerEmail
    ? buildRuntimeChannel(ownerEmail, 'mobile_observer')
    : null;

  useEffect(() => {
    if (!ownerEmail || initialLoaded) return;

    async function loadInitialViolations() {
      try {
        const walletsResult = await api.wallets.listWallets();
        const walletList = walletsResult.wallets || [];
        if (walletList.length === 0) return;

        const primaryWallet = walletList[0].walletAddress;
        const tradesResult = await api.chain.listRecentTrades(primaryWallet);
        const trades = tradesResult.trades || [];
        const violationTrades = trades
          .filter((trade) => trade.isViolation)
          .slice(0, 10)
          .map((trade) => ({
            ruleId: trade.violationRuleId || trade.signature,
            ruleTitle: trade.violationRuleTitle || trade.token || 'Trade violation',
            ruleSummary: `${trade.side || 'Trade'} on ${trade.platform || 'DEX'}`,
            surface: 'chain',
            requestedAt: trade.timestamp || new Date().toISOString(),
            problemIndex: trade.problemIndex,
            lockedStakeLamports: trade.lockedStakeLamports
          }));

        if (violationTrades.length > 0) {
          setViolations((prev) => {
            const existingIds = new Set(prev.map((v) => v.ruleId));
            const newItems = violationTrades.filter((v) => !existingIds.has(v.ruleId));
            return [...prev, ...newItems];
          });
        }
      } catch {}
      setInitialLoaded(true);
    }

    loadInitialViolations();
  }, [ownerEmail, initialLoaded]);

  useRealtimeChannel(rulesChannel, {
    onEvent(event) {
      if (event?.eventType === 'rule_triggered' || event?.eventType === 'bypass_offered') {
        setViolations((prev) => {
          const exists = prev.some((v) => v.ruleId === event.ruleId);
          if (exists) return prev;
          return [event, ...prev];
        });
      }
      if (event?.eventType === 'rule_complied' || event?.eventType === 'bypass_confirmed') {
        setViolations((prev) => prev.filter((v) => v.ruleId !== event.ruleId));
      }
    }
  });

  useRealtimeChannel(runtimeChannel);

  const comply = useCallback(async (violation) => {
    setLoading(true);
    try {
      await api.rules.reportRuntimeEvent({
        runtimeSurface: violation.surface || 'mobile_observer',
        eventType: 'rule_complied',
        ruleId: violation.ruleId,
        ownerEmail
      });
      setViolations((prev) => prev.filter((v) => v.ruleId !== violation.ruleId));
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to report compliance.');
    } finally {
      setLoading(false);
    }
  }, [ownerEmail]);

  const dismiss = useCallback((ruleId) => {
    setViolations((prev) => prev.filter((v) => v.ruleId !== ruleId));
  }, []);

  return { violations, loading, comply, dismiss };
}
