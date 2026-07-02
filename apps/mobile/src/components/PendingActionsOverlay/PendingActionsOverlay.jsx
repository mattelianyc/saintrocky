import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/api/client.js';
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { buildRulesChannel } from '@saintrocky/realtime';
import { extractPendingActions } from '@saintrocky/shared';
import { PendingActionsPill } from '@saintrocky/ui-native';

const PendingActionsOverlayContext = createContext(null);

export function PendingActionsOverlay({ ownerEmail, children }) {
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState([]);
  const [submittingActionId, setSubmittingActionId] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

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

  useEffect(() => {
    if (!ownerEmail) {
      setSheetVisible(false);
    }
  }, [ownerEmail]);

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
  const pendingActionsCount = pendingActions.length;

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

  const openSheet = useCallback(() => {
    if (!ownerEmail) return;
    setSheetVisible(true);
  }, [ownerEmail]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const toggleSheet = useCallback(() => {
    if (!ownerEmail) return;
    setSheetVisible((previousValue) => !previousValue);
  }, [ownerEmail]);

  const contextValue = useMemo(() => ({
    hasActivityAccess: Boolean(ownerEmail),
    pendingActions,
    pendingActionsCount,
    submittingActionId,
    sheetVisible,
    openSheet,
    closeSheet,
    toggleSheet
  }), [closeSheet, openSheet, ownerEmail, pendingActions, pendingActionsCount, sheetVisible, submittingActionId, toggleSheet]);

  return (
    <PendingActionsOverlayContext.Provider value={contextValue}>
      {children}
      <PendingActionsPill
        pendingActions={pendingActions}
        submittingActionId={submittingActionId}
        onConfirmAction={handleConfirmAction}
        onCancelAction={handleCancelAction}
        bottomInset={insets.bottom}
        visible={sheetVisible}
        onOpenChange={setSheetVisible}
        showFloatingTrigger={false}
      />
    </PendingActionsOverlayContext.Provider>
  );
}

export function usePendingActionsOverlay() {
  const context = useContext(PendingActionsOverlayContext);

  if (!context) {
    return {
      hasActivityAccess: false,
      pendingActions: [],
      pendingActionsCount: 0,
      submittingActionId: '',
      sheetVisible: false,
      openSheet: () => {},
      closeSheet: () => {},
      toggleSheet: () => {}
    };
  }

  return context;
}
