import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api/client.js';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { buildRulesChannel } from '@saintrocky/realtime';
import { extractPendingActions } from '@saintrocky/shared';
import { PendingActionsPill } from '@saintrocky/ui-native';

export function PendingActionsOverlay({ ownerEmail }) {
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState([]);
  const [submittingActionId, setSubmittingActionId] = useState('');

  const loadRules = useCallback(async () => {
    if (!ownerEmail) {
      setRules([]);
      return;
    }

    try {
      const response = await api.rules.listRules(ownerEmail);
      setRules(response.rules || []);
    } catch {
      setRules([]);
    }
  }, [ownerEmail]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const rulesChannel = ownerEmail ? buildRulesChannel(ownerEmail) : null;

  useRealtimeChannel(rulesChannel, {
    onSnapshot(payload) {
      setRules(payload?.rules || []);
    },
    onEvent() {
      loadRules();
    }
  });

  const pendingActions = useMemo(() => extractPendingActions(rules), [rules]);

  const handleConfirmAction = useCallback(async (action) => {
    if (!action?.ruleId || !action?.requestId) return;

    setSubmittingActionId(action.actionId);

    try {
      if (action.actionKind === 'override') {
        await api.rules.confirmOverrideRequest(action.ruleId, action.requestId);
      } else if (action.actionKind === 'deactivation') {
        await api.rules.confirmDeactivationRequest(action.ruleId, action.requestId);
      }

      await loadRules();
    } finally {
      setSubmittingActionId('');
    }
  }, [loadRules]);

  const handleCancelAction = useCallback(async (action) => {
    if (!action?.ruleId || !action?.requestId) return;

    setSubmittingActionId(action.actionId);

    try {
      if (action.actionKind === 'override') {
        await api.rules.cancelOverrideRequest(action.ruleId, action.requestId);
      } else if (action.actionKind === 'deactivation') {
        await api.rules.cancelDeactivationRequest(action.ruleId, action.requestId);
      }

      await loadRules();
    } finally {
      setSubmittingActionId('');
    }
  }, [loadRules]);

  return (
    <PendingActionsPill
      pendingActions={pendingActions}
      submittingActionId={submittingActionId}
      onConfirmAction={handleConfirmAction}
      onCancelAction={handleCancelAction}
      bottomInset={insets.bottom}
    />
  );
}
