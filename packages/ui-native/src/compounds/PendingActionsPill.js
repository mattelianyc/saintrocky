import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { calculateOverrideFee, formatFeeSol, formatRemainingDuration } from '@saintrocky/fuckyoupayme';

import { Button } from '../primitives/Button.js';
import { useTheme } from '../theme.js';

const SHEET_HEIGHT = 520;

function createNowSnapshot() {
  return new Date();
}

function buildLiveAction(action, now) {
  if (action.actionKind === 'scheduled_edit') {
    return {
      ...action,
      currentFeeLamports: 0,
      currentFeeSol: Number(action.staticFeeSol || 0),
      isFree: !action.paymentRequired,
      remainingLabel: action.effectiveAt ? formatRemainingDuration(action.effectiveAt, now) : '0m'
    };
  }

  const feeQuote = calculateOverrideFee({
    problemIndex: action.problemIndex,
    lockedStakeLamports: action.lockedStakeLamports,
    requestedAt: action.requestedAt,
    now
  });

  return {
    ...action,
    currentFeeLamports: feeQuote.feeLamports,
    currentFeeSol: feeQuote.feeSol,
    isFree: feeQuote.isFree,
    freeAt: feeQuote.freeAt,
    remainingLabel: formatRemainingDuration(feeQuote.freeAt, now)
  };
}

function formatActionFeeLabel(action) {
  if (action.actionKind === 'scheduled_edit') {
    if (!action.paymentRequired) return 'FREE';
    return `${Number(action.staticFeeSol || 0).toFixed(4)} SOL`;
  }

  return action.isFree ? 'FREE' : `${formatFeeSol(action.currentFeeLamports)} SOL`;
}

function formatActionCountdownLabel(action) {
  if (action.actionKind === 'scheduled_edit') {
    return `Applies in ${action.remainingLabel}`;
  }

  return action.isFree ? 'Ready to confirm for free' : `Free in ${action.remainingLabel}`;
}

function isActionable(action) {
  return action.actionKind === 'override' || action.actionKind === 'deactivation';
}

function PendingActionListItem({ action, isSubmitting, onConfirmAction, onCancelAction, styles }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderCopy}>
          <Text style={styles.itemEyebrow}>{action.actionLabel.toUpperCase()}</Text>
          <Text style={styles.itemTitle} numberOfLines={2}>{action.ruleTitle}</Text>
        </View>
        <Text style={styles.itemFee}>{formatActionFeeLabel(action)}</Text>
      </View>

      <Text style={styles.itemSummary} numberOfLines={2}>{action.ruleSummary}</Text>
      <Text style={styles.itemMeta}>{formatActionCountdownLabel(action)}</Text>

      <View style={styles.itemActions}>
        {isActionable(action) ? (
          <>
            <Button
              size="sm"
              onPress={() => onConfirmAction?.(action)}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              {action.isFree ? 'Confirm free' : 'Confirm'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onCancelAction?.(action)}
              disabled={isSubmitting}
              style={styles.actionButton}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Text style={styles.scheduledHint}>This edit applies automatically.</Text>
        )}
      </View>
    </View>
  );
}

export function PendingActionsPill({
  pendingActions = [],
  submittingActionId = '',
  onConfirmAction,
  onCancelAction,
  bottomInset = 0
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, bottomInset), [theme, bottomInset]);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(createNowSnapshot);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    const intervalId = setInterval(() => setNow(createNowSnapshot()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: open ? 0 : SHEET_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
  }, [open, translateY]);

  const liveActions = useMemo(
    () => pendingActions.map((action) => buildLiveAction(action, now)),
    [now, pendingActions]
  );

  const totalFeeLamports = useMemo(
    () => liveActions.reduce((sum, action) => sum + (action.currentFeeLamports || 0), 0),
    [liveActions]
  );
  const hasPendingActions = liveActions.length > 0;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open pending actions"
        onPress={() => setOpen(true)}
        style={styles.pill}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{liveActions.length}</Text>
        </View>
        <View style={styles.pillCopy}>
          <Text style={styles.pillTitle}>{hasPendingActions ? 'Pending actions' : 'No pending actions'}</Text>
          <Text style={styles.pillMeta}>
            {hasPendingActions ? `${formatFeeSol(totalFeeLamports)} SOL live fee` : 'Decay timers show up here'}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.overlayTouchable} onPress={() => setOpen(false)} />
          <Animated.View
            style={[
              styles.sheet,
              {
                height: SHEET_HEIGHT,
                paddingBottom: bottomInset + 20,
                transform: [{ translateY }]
              }
            ]}
          >
            <View style={styles.handleBar} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>PENDING ACTIONS</Text>
                <Text style={styles.sheetSubtitle}>
                  {hasPendingActions ? `${liveActions.length} timers running` : 'No active decay timers'}
                </Text>
              </View>
              <Button variant="ghost" size="sm" onPress={() => setOpen(false)}>
                Close
              </Button>
            </View>

            <View style={styles.summaryBar}>
              <Text style={styles.summaryTitle}>
                {hasPendingActions
                  ? `${formatFeeSol(totalFeeLamports)} SOL currently payable`
                  : 'Start an override or cooldown to track it here'}
              </Text>
              <Text style={styles.summarySubtitle}>
                {hasPendingActions
                  ? 'Overrides and deactivations decay every second.'
                  : 'This pill stays visible so users always know where to look.'}
              </Text>
            </View>

            {hasPendingActions ? (
              <FlatList
                data={liveActions}
                keyExtractor={(item) => item.actionId}
                renderItem={({ item }) => (
                  <PendingActionListItem
                    action={item}
                    isSubmitting={submittingActionId === item.actionId}
                    onConfirmAction={onConfirmAction}
                    onCancelAction={onCancelAction}
                    styles={styles}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No live override or rule-change timers yet.</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(theme, bottomInset) {
  const { spacing, typography } = theme;

  return StyleSheet.create({
    pill: {
      position: 'absolute',
      right: spacing.medium,
      bottom: bottomInset + spacing.medium,
      minWidth: 220,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.small,
      paddingHorizontal: spacing.small,
      borderRadius: 999,
      backgroundColor: theme.shell.panel,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.shell.border
    },
    badge: {
      minWidth: 28,
      height: 28,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
      marginRight: spacing.small
    },
    badgeText: {
      color: theme.colors.primaryText,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightBold
    },
    pillCopy: {
      flex: 1
    },
    pillTitle: {
      color: theme.colors.foreground,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightBold
    },
    pillMeta: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeXsmall,
      marginTop: 2
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end'
    },
    overlayTouchable: {
      flex: 1
    },
    sheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingTop: spacing.small
    },
    handleBar: {
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.shell.border,
      alignSelf: 'center',
      marginBottom: spacing.small
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.small
    },
    sheetTitle: {
      color: theme.colors.foreground,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      fontWeight: typography.weightBold,
      letterSpacing: typography.letterSpacingUltraWide
    },
    sheetSubtitle: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      marginTop: 4
    },
    summaryBar: {
      marginHorizontal: spacing.medium,
      marginBottom: spacing.small,
      padding: spacing.small,
      borderRadius: 12,
      backgroundColor: theme.shell.backgroundSoft
    },
    summaryTitle: {
      color: theme.colors.foreground,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightBold
    },
    summarySubtitle: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeXsmall,
      marginTop: 4
    },
    listContent: {
      paddingHorizontal: spacing.medium,
      paddingBottom: spacing.medium
    },
    item: {
      paddingVertical: spacing.small,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.shell.border
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.small
    },
    itemHeaderCopy: {
      flex: 1
    },
    itemEyebrow: {
      color: theme.shell.textMuted,
      fontFamily: typography.fontFamilyMono,
      fontSize: 10,
      fontWeight: typography.weightSemibold,
      letterSpacing: typography.letterSpacingWide,
      marginBottom: 4
    },
    itemTitle: {
      color: theme.colors.foreground,
      fontSize: typography.sizeBase,
      fontWeight: typography.weightSemibold,
      lineHeight: 20
    },
    itemFee: {
      color: theme.colors.warning,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeSmall,
      fontWeight: typography.weightBold
    },
    itemSummary: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      lineHeight: 18,
      marginTop: spacing.xsmall
    },
    itemMeta: {
      color: theme.colors.accent,
      fontFamily: typography.fontFamilyMono,
      fontSize: typography.sizeXsmall,
      marginTop: spacing.xsmall
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xsmall,
      marginTop: spacing.small
    },
    actionButton: {
      flex: 1
    },
    scheduledHint: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall
    },
    emptyState: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.large
    },
    emptyStateText: {
      color: theme.shell.textMuted,
      fontSize: typography.sizeSmall,
      lineHeight: 20
    }
  });
}
