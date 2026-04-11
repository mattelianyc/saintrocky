import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';

import { api } from '@/api/client.js';
import {
  formatCompiledRuleSurfaceLabel,
  RULE_USER_RULE_STATUS_LABELS
} from '@saintrocky/shared';
import { Button, useTheme } from '@saintrocky/ui-native';

import { createStyles } from '@/screens/RulesScreen/RuleDetailScreen.styles.js';

const STATUS_DOT_COLORS = {
  active: '#4ade80',
  inactive: 'rgba(255,255,255,0.3)',
  draft: '#fbbf24'
};

function DetailRow({ label, value, styles }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatCooldownRemaining(milliseconds) {
  if (milliseconds <= 0) return 'Ready';
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function RuleDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rule = route.params?.rule;
  const [updating, setUpdating] = useState(false);
  const [deactivationRequest, setDeactivationRequest] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const statusLabel = RULE_USER_RULE_STATUS_LABELS?.[rule?.status] || rule?.status;
  const isActive = rule?.status === 'active';
  const isDraft = rule?.isDraft;
  const dotColor = STATUS_DOT_COLORS[rule?.status] || theme.shell.textMuted;

  useEffect(() => {
    if (!deactivationRequest?.confirmableAfter) return;

    const targetTime = new Date(deactivationRequest.confirmableAfter).getTime();

    const tick = () => {
      const remaining = Math.max(0, targetTime - Date.now());
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearInterval(intervalId);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [deactivationRequest]);

  const handleActivate = useCallback(async () => {
    if (!rule?.ruleId) return;
    Alert.alert(
      'Activate rule?',
      `This will enable enforcement of "${rule.title || 'this rule'}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.rules.updateStatus(rule.ruleId, 'active');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to activate rule.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  }, [rule, navigation]);

  const handleRequestDeactivation = useCallback(async () => {
    if (!rule?.ruleId) return;
    Alert.alert(
      'Request deactivation?',
      'A cooldown period will begin. You can confirm deactivation once it expires.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start cooldown',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await api.rules.requestDeactivation(rule.ruleId);
              setDeactivationRequest(result.request);
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to request deactivation.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  }, [rule]);

  const handleConfirmDeactivation = useCallback(async () => {
    if (!rule?.ruleId || !deactivationRequest?.requestId) return;
    setUpdating(true);
    try {
      await api.rules.confirmDeactivationRequest(
        rule.ruleId,
        deactivationRequest.requestId
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Cannot confirm yet. Cooldown may still be active.');
    } finally {
      setUpdating(false);
    }
  }, [rule, deactivationRequest, navigation]);

  const handleCancelDeactivation = useCallback(async () => {
    if (!rule?.ruleId || !deactivationRequest?.requestId) return;
    setUpdating(true);
    try {
      await api.rules.cancelDeactivationRequest(
        rule.ruleId,
        deactivationRequest.requestId
      );
      setDeactivationRequest(null);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to cancel deactivation request.');
    } finally {
      setUpdating(false);
    }
  }, [rule, deactivationRequest]);

  const handleViewOnWeb = useCallback(() => {
    Linking.openURL('https://www.thestandard.dev/dashboard').catch(() => {
      Alert.alert('Error', 'Could not open the web dashboard.');
    });
  }, []);

  if (!rule) return null;

  const cooldownActive = deactivationRequest && cooldownRemaining > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{rule.title || rule.summary || 'Rule'}</Text>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </View>

      {rule.summary && (
        <Text style={styles.summary}>{rule.summary}</Text>
      )}

      <Text style={styles.sectionKicker}>DETAILS</Text>
      <DetailRow label="Status" value={statusLabel || rule.status} styles={styles} />
      <DetailRow
        label="Enforcement surfaces"
        value={
          rule.enforcementSurfaces?.map(formatCompiledRuleSurfaceLabel).join(', ') || '—'
        }
        styles={styles}
      />
      <DetailRow
        label="Schedule"
        value={rule.scheduleType || rule.schedule?.type || '—'}
        styles={styles}
      />
      {rule.schedule?.timezone && (
        <DetailRow label="Timezone" value={rule.schedule.timezone} styles={styles} />
      )}
      {rule.bypassFeeModel && (
        <DetailRow label="Bypass fee model" value={rule.bypassFeeModel} styles={styles} />
      )}
      {rule.source && (
        <DetailRow label="Source" value={rule.source} styles={styles} />
      )}

      {rule.targets?.length > 0 && (
        <>
          <Text style={styles.sectionKicker}>TARGETS</Text>
          {rule.targets.map((target, index) => (
            <DetailRow
              key={index}
              label={target.type || 'Target'}
              value={target.value || target.pattern || JSON.stringify(target)}
              styles={styles}
            />
          ))}
        </>
      )}

      {deactivationRequest && (
        <>
          <Text style={styles.sectionKicker}>DEACTIVATION REQUEST</Text>
          <View style={styles.cooldownSection}>
            {cooldownActive ? (
              <>
                <Text style={styles.cooldownTimer}>
                  {formatCooldownRemaining(cooldownRemaining)}
                </Text>
                <Text style={styles.cooldownHint}>
                  You can confirm deactivation once the cooldown expires.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cooldownReady}>READY</Text>
                <Text style={styles.cooldownHint}>
                  Cooldown complete. You may now confirm deactivation.
                </Text>
              </>
            )}
          </View>
          <View style={styles.actions}>
            <Button
              variant="danger"
              onPress={handleConfirmDeactivation}
              disabled={updating || cooldownActive}
            >
              {updating ? 'Confirming…' : 'Confirm deactivation'}
            </Button>
            <View style={styles.actionSpacer} />
            <Button
              variant="ghost"
              onPress={handleCancelDeactivation}
              disabled={updating}
            >
              Cancel request
            </Button>
          </View>
        </>
      )}

      {!isDraft && !deactivationRequest && (
        <View style={styles.actions}>
          {isActive ? (
            <Button
              variant="danger"
              onPress={handleRequestDeactivation}
              disabled={updating}
              leadingIconName="pause"
            >
              {updating ? 'Requesting…' : 'Deactivate rule'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={handleActivate}
              disabled={updating}
              leadingIconName="activate"
            >
              {updating ? 'Activating…' : 'Activate rule'}
            </Button>
          )}
          <View style={styles.actionSpacer} />
          <Button
            variant="ghost"
            onPress={handleViewOnWeb}
            leadingIconName="link"
          >
            Manage on web
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
