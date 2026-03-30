import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';
import { calculateOverrideFee, formatFeeSol, formatRemainingDuration } from '@saintrocky/fuckyoupayme';
import { useTheme } from '../theme.js';
import { Button } from '../primitives/Button.js';

export function ViolationCard({
  violation,
  onComply,
  onBypass,
  loading = false
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const feeQuote = useMemo(() => {
    if (!violation?.requestedAt) return null;
    return calculateOverrideFee({
      problemIndex: violation.problemIndex,
      lockedStakeLamports: violation.lockedStakeLamports,
      requestedAt: violation.requestedAt,
      now
    });
  }, [violation, now]);

  if (!violation) return null;

  const ruleTitle = violation.ruleTitle || violation.ruleSummary || 'Rule violation';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.alertIcon}>
          <Icon name="warning" size={20} color={theme.colors.error} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.alertLabel}>Violation Detected</Text>
          <Text style={styles.ruleTitle} numberOfLines={2}>{ruleTitle}</Text>
        </View>
      </View>

      {violation.surface ? (
        <Text style={styles.surfaceLabel}>
          Surface: {violation.surface}
        </Text>
      ) : null}

      {feeQuote ? (
        <View style={styles.feeSection}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Override fee</Text>
            <Text style={styles.feeValue}>
              {feeQuote.isFree ? 'FREE' : `${formatFeeSol(feeQuote.feeLamports)} SOL`}
            </Text>
          </View>
          {!feeQuote.isFree ? (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Free in</Text>
              <Text style={styles.feeCountdown}>
                {formatRemainingDuration(feeQuote.freeAt, now)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          onPress={onComply}
          disabled={loading}
          style={styles.actionButton}
        >
          Comply
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={onBypass}
          disabled={loading}
          style={styles.actionButton}
        >
          {feeQuote && !feeQuote.isFree
            ? `Bypass · ${formatFeeSol(feeQuote.feeLamports)} SOL`
            : 'Bypass'}
        </Button>
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 14,
      padding: 16,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.error + '40'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12
    },
    alertIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.error + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
    },
    headerText: {
      flex: 1
    },
    alertLabel: {
      color: theme.colors.error,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4
    },
    ruleTitle: {
      color: theme.colors.foreground,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20
    },
    surfaceLabel: {
      color: theme.colors.muted,
      fontSize: 12,
      marginBottom: 12
    },
    feeSection: {
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 10,
      padding: 12,
      marginBottom: 14
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    feeLabel: {
      color: theme.colors.muted,
      fontSize: 13
    },
    feeValue: {
      color: theme.colors.warning,
      fontSize: 15,
      fontWeight: '700'
    },
    feeCountdown: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '600'
    },
    actions: {
      flexDirection: 'row',
      gap: 10
    },
    actionButton: {
      flex: 1
    }
  });
}
