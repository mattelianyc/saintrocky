import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { api } from '@saintrocky/api-client';
import {
  formatCompiledRuleSurfaceLabel,
  RULE_USER_RULE_STATUS_LABELS
} from '@saintrocky/shared';
import { Badge, Button, Card, SectionHeader, useTheme } from '@saintrocky/ui-native';

import { createStyles } from '@/screens/RulesScreen/RuleDetailScreen.styles.js';

export function RuleDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rule = route.params?.rule;
  const [updating, setUpdating] = useState(false);

  const statusLabel = RULE_USER_RULE_STATUS_LABELS?.[rule?.status] || rule?.status;
  const isActive = rule?.status === 'active';
  const isDraft = rule?.isDraft;

  const toggleStatus = useCallback(async () => {
    if (!rule?.ruleId || isDraft) return;
    const nextStatus = isActive ? 'inactive' : 'active';

    Alert.alert(
      `${isActive ? 'Deactivate' : 'Activate'} rule?`,
      `This will ${isActive ? 'pause' : 'enable'} enforcement of "${rule.title || 'this rule'}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Deactivate' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.rules.updateStatus(rule.ruleId, nextStatus);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to update rule status.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  }, [rule, isActive, isDraft, navigation]);

  if (!rule) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{rule.title || rule.summary || 'Rule'}</Text>
        <Badge variant={isActive ? 'success' : isDraft ? 'warning' : 'muted'}>
          {statusLabel || rule.status}
        </Badge>
      </View>

      {rule.summary ? (
        <Text style={styles.summary}>{rule.summary}</Text>
      ) : null}

      <Card style={styles.detailCard}>
        <DetailRow
          label="Enforcement surfaces"
          value={
            rule.enforcementSurfaces?.map(formatCompiledRuleSurfaceLabel).join(', ')
            || '—'
          }
          styles={styles}
        />
        <DetailRow
          label="Schedule"
          value={rule.scheduleType || rule.schedule?.type || '—'}
          styles={styles}
        />
        {rule.schedule?.timezone ? (
          <DetailRow label="Timezone" value={rule.schedule.timezone} styles={styles} />
        ) : null}
        {rule.bypassFeeModel ? (
          <DetailRow label="Bypass fee model" value={rule.bypassFeeModel} styles={styles} />
        ) : null}
        {rule.source ? (
          <DetailRow label="Source" value={rule.source} styles={styles} />
        ) : null}
      </Card>

      {rule.targets?.length ? (
        <>
          <SectionHeader title="Targets" />
          <Card style={styles.detailCard}>
            {rule.targets.map((target, index) => (
              <DetailRow
                key={index}
                label={target.type || 'Target'}
                value={target.value || target.pattern || JSON.stringify(target)}
                styles={styles}
              />
            ))}
          </Card>
        </>
      ) : null}

      {!isDraft ? (
        <View style={styles.actions}>
          <Button
            variant={isActive ? 'danger' : 'primary'}
            onPress={toggleStatus}
            disabled={updating}
            leadingIconName={isActive ? 'pause' : 'activate'}
          >
            {updating
              ? 'Updating…'
              : isActive ? 'Deactivate rule' : 'Activate rule'}
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({ label, value, styles }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}
