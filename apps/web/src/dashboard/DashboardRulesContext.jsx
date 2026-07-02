"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@saintrocky/api-client";
import { buildRulesChannel, createRealtimeClient } from "@saintrocky/realtime";
import { extractPendingActions } from "@saintrocky/shared";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

const DashboardRulesContext = createContext(null);

export function DashboardRulesProvider({ children }) {
  const realtimeClientRef = useRef(null);
  const [rules, setRules] = useState([]);
  const [submittingActionId, setSubmittingActionId] = useState("");
  const { sessionUser } = useAuthSession();
  const ownerEmail = sessionUser?.email || "";

  const loadRules = useCallback(async (nextOwnerEmail) => {
    if (!nextOwnerEmail) {
      setRules([]);
      return;
    }

    try {
      const response = await api.rules.listRules(nextOwnerEmail);
      setRules(response.rules || []);
    } catch {
      setRules([]);
    }
  }, []);

  useEffect(() => {
    if (!ownerEmail) {
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
      setRules([]);
      return undefined;
    }

    let isMounted = true;
    let cleanupRulesSubscription = null;

    async function connectRealtimeRules() {
      try {
        await loadRules(ownerEmail);

        const runtimeAuth = await api.auth.createRuntimeToken({ runtimeSurface: "web" });
        if (!isMounted) return;

        const realtimeClient = createRealtimeClient({
          clientType: "web",
          authToken: runtimeAuth.token
        });

        realtimeClientRef.current?.disconnect();
        realtimeClientRef.current = realtimeClient;
        realtimeClient.connect();

        cleanupRulesSubscription = realtimeClient.subscribe(buildRulesChannel(ownerEmail), (message) => {
          if (!isMounted || message.type !== "channel.snapshot") return;
          setRules(message.payload?.rules || []);
        });
      } catch {
        if (isMounted) {
          setRules([]);
        }
      }
    }

    connectRealtimeRules();

    return () => {
      isMounted = false;
      cleanupRulesSubscription?.();
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
    };
  }, [loadRules, ownerEmail]);

  const pendingActions = useMemo(() => extractPendingActions(rules), [rules]);

  const handleConfirmAction = useCallback(async (action) => {
    if (!action?.ruleId || !action?.requestId) return;

    setSubmittingActionId(action.actionId);

    try {
      if (action.actionKind === "override") {
        await api.rules.confirmOverrideRequest(action.ruleId, action.requestId);
      } else if (action.actionKind === "deactivation") {
        await api.rules.confirmDeactivationRequest(action.ruleId, action.requestId);
      }

      await loadRules(ownerEmail);
    } finally {
      setSubmittingActionId("");
    }
  }, [loadRules, ownerEmail]);

  const handleCancelAction = useCallback(async (action) => {
    if (!action?.ruleId || !action?.requestId) return;

    setSubmittingActionId(action.actionId);

    try {
      if (action.actionKind === "override") {
        await api.rules.cancelOverrideRequest(action.ruleId, action.requestId);
      } else if (action.actionKind === "deactivation") {
        await api.rules.cancelDeactivationRequest(action.ruleId, action.requestId);
      }

      await loadRules(ownerEmail);
    } finally {
      setSubmittingActionId("");
    }
  }, [loadRules, ownerEmail]);

  const value = useMemo(
    () => ({
      rules,
      pendingActions,
      submittingActionId,
      handleConfirmAction,
      handleCancelAction
    }),
    [handleCancelAction, handleConfirmAction, pendingActions, rules, submittingActionId]
  );

  return <DashboardRulesContext.Provider value={value}>{children}</DashboardRulesContext.Provider>;
}

export function useDashboardRules() {
  const context = useContext(DashboardRulesContext);
  if (!context) {
    throw new Error("useDashboardRules must be used within DashboardRulesProvider.");
  }
  return context;
}
