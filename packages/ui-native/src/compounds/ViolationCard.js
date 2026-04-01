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
  bypassLabel,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.alertDot} />
        <View style={styles.headerText}>
          <Text style={styles.alertLabel}>VIOLATION</Text>
          <Text style={styles.ruleTitle} numberOfLines={2}>{ruleTitle}</Text>
        </View>
      </View>

      {violation.surface ? (
        <Text style={styles.surfaceLabel}>{violation.surface}</Text>
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
          {bypassLabel || (feeQuote && !feeQuote.isFree
            ? `Bypass · ${formatFeeSol(feeQuote.feeLamports)} SOL`
            : 'Bypass')}
        </Button>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      paddingVertical: spacing?.medium || 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.error + '30'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing?.small || 12
    },
    alertDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.error,
      marginTop: 5,
      marginRight: spacing?.small || 12
    },
    headerText: {
      flex: 1
    },
    alertLabel: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.error,
      fontSize: typography?.sizeXxsmall || 10,
      fontWeight: typography?.weightBold || '700',
      letterSpacing: typography?.letterSpacingUltraWide || 3.0,
      marginBottom: 4
    },
    ruleTitle: {
      color: theme.colors.foreground,
      fontSize: typography?.sizeBase || 15,
      fontWeight: typography?.weightSemibold || '600',
      lineHeight: 20
    },
    surfaceLabel: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeXxsmall || 10,
      letterSpacing: typography?.letterSpacingWide || 1.2,
      marginBottom: spacing?.small || 12,
      textTransform: 'uppercase'
    },
    feeSection: {
      backgroundColor: theme.shell?.backgroundSoft || theme.colors.inputBackground,
      padding: spacing?.small || 12,
      marginBottom: spacing?.medium || 14
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    feeLabel: {
      color: theme.shell?.textMuted || theme.colors.muted,
      fontSize: typography?.sizeSmall || 13
    },
    feeValue: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.warning,
      fontSize: typography?.sizeBase || 15,
      fontWeight: typography?.weightBold || '700'
    },
    feeCountdown: {
      fontFamily: typography?.fontFamilyMono || 'System',
      color: theme.colors.accent,
      fontSize: typography?.sizeSmall || 13,
      fontWeight: typography?.weightSemibold || '600'
    },
    actions: {
      flexDirection: 'row',
      gap: spacing?.xsmall || 10
    },
    actionButton: {
      flex: 1
    }
  });
}
