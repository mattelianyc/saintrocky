"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@saintrocky/api-client";
import { buildExtensionSessionsChannel, buildRulesChannel, createRealtimeClient } from "@saintrocky/realtime";
import { BROWSER_EXTENSION_MESSAGE_TYPES, RULE_USER_RULE_STATUS_LABELS } from "@saintrocky/shared";

export function useRulesWorkspaceData({ refreshToken = 0 } = {}) {
  const realtimeClientRef = useRef(null);
  const [owners, setOwners] = useState([]);
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState("");
  const [rules, setRules] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [extensionSessions, setExtensionSessions] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState("idle");

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.ruleId === selectedRuleId) || rules[0] || null,
    [rules, selectedRuleId]
  );
  const activeRules = useMemo(() => rules.filter((rule) => rule.status === "active"), [rules]);
  const scheduledEditRules = useMemo(() => rules.filter((rule) => Boolean(rule.pendingEdit)), [rules]);
  const pausedRules = useMemo(() => rules.filter((rule) => rule.status === "paused"), [rules]);
  const archivedRules = useMemo(() => rules.filter((rule) => rule.status === "archived"), [rules]);

  const loadRules = useCallback(async function loadRules(nextOwnerEmail = "") {
    setStatus("loading");
    setMessage("");

    try {
      const [response, sessionsResponse] = await Promise.all([
        api.rules.listRules(nextOwnerEmail),
        api.extensionSessions.list(nextOwnerEmail || undefined)
      ]);
      setOwners(response.owners || []);
      setSelectedOwnerEmail(response.owner?.email || nextOwnerEmail || "");
      setRules(response.rules || []);
      setDrafts(response.drafts || []);
      setExtensionSessions(sessionsResponse.sessions || []);
      setSelectedRuleId((currentRuleId) =>
        (response.rules || []).some((rule) => rule.ruleId === currentRuleId)
          ? currentRuleId
          : response.rules?.[0]?.ruleId || ""
      );
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to load user rules right now.");
    }
  }, []);

  useEffect(() => {
    loadRules("");
  }, [refreshToken, loadRules]);

  useEffect(() => {
    let isMounted = true;
    let cleanupRulesSubscription = null;
    let cleanupSessionsSubscription = null;

    async function connectRealtime() {
      try {
        const auth = await api.auth.createRuntimeToken({ runtimeSurface: "web" });
        if (!isMounted) return;

        const realtimeClient = createRealtimeClient({ clientType: "web", authToken: auth.token });

        globalThis.window?.postMessage(
          {
            type: BROWSER_EXTENSION_MESSAGE_TYPES.authHandoff,
            payload: {
              token: auth.token,
              user: auth.user,
              apiBaseUrl: globalThis.window?.__SAINTROCKY_API_BASE_URL__ || ""
            }
          },
          globalThis.window?.location?.origin || "*"
        );

        realtimeClientRef.current = realtimeClient;
        realtimeClient.onConnectionStateChange((connection) => {
          if (isMounted) setRealtimeStatus(connection.state);
        });
        realtimeClient.connect();

        const ownerEmail = selectedOwnerEmail || owners[0]?.email;
        if (!ownerEmail) return;

        cleanupRulesSubscription = realtimeClient.subscribe(buildRulesChannel(ownerEmail), (event) => {
          if (!isMounted || event.type !== "channel.snapshot") return;
          setRules(event.payload?.rules || []);
          setDrafts(event.payload?.drafts || []);
        });

        cleanupSessionsSubscription = realtimeClient.subscribe(
          buildExtensionSessionsChannel(ownerEmail),
          (event) => {
            if (!isMounted || event.type !== "channel.snapshot") return;
            setExtensionSessions(event.payload?.sessions || []);
          }
        );
      } catch {
        if (isMounted) setRealtimeStatus("error");
      }
    }

    connectRealtime();

    return () => {
      isMounted = false;
      cleanupRulesSubscription?.();
      cleanupSessionsSubscription?.();
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
    };
  }, [owners, selectedOwnerEmail]);

  async function handleActivateRule(ruleId) {
    setStatus("submitting");
    setMessage("");

    try {
      await api.rules.updateStatus(ruleId, "active");
      await loadRules(selectedOwnerEmail);
      setMessage("Rule updated: active.");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to update the rule.");
    }
  }

  async function handleRequestDeactivation(ruleId, targetStatus) {
    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.requestDeactivation(ruleId, { targetStatus });
      const quote = response.request?.currentQuote;
      await loadRules(selectedOwnerEmail);
      setMessage(
        quote?.isFree
          ? `${RULE_USER_RULE_STATUS_LABELS[targetStatus] || targetStatus} is ready to confirm for free.`
          : `Cooldown started. Confirm now for ${quote?.feeSol?.toFixed(4) || "0.0000"} SOL or wait until ${new Date(quote?.freeAt || Date.now()).toLocaleString()} for free.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to start the deactivation cooldown.");
    }
  }

  async function handleConfirmDeactivation(ruleId, requestId) {
    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.confirmDeactivationRequest(ruleId, requestId);
      const targetStatus = response.request?.metadata?.targetStatus || response.rule?.status;
      const feeSol = response.request?.currentQuote?.feeSol ?? 0;
      await loadRules(selectedOwnerEmail);
      setMessage(
        feeSol > 0
          ? `${RULE_USER_RULE_STATUS_LABELS[targetStatus] || targetStatus} confirmed for ${feeSol.toFixed(4)} SOL.`
          : `${RULE_USER_RULE_STATUS_LABELS[targetStatus] || targetStatus} confirmed for free.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to confirm this deactivation request.");
    }
  }

  async function handleCancelDeactivation(ruleId, requestId) {
    setStatus("submitting");
    setMessage("");

    try {
      await api.rules.cancelDeactivationRequest(ruleId, requestId);
      await loadRules(selectedOwnerEmail);
      setMessage("Deactivation request cancelled.");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to cancel this deactivation request.");
    }
  }

  async function handlePublishDraft(draftId) {
    setStatus("submitting");
    setMessage("");

    try {
      await api.rules.publishDraft(draftId, { ownerEmail: selectedOwnerEmail || undefined });
      await loadRules(selectedOwnerEmail);
      setMessage("Draft activated and added to current rules.");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to activate the draft.");
    }
  }

  async function handleEditRule(payload) {
    if (!selectedRule) return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.editRule(selectedRule.ruleId, payload);
      await loadRules(selectedOwnerEmail);
      setSelectedRuleId(response.rule.ruleId);
      setMessage(
        response.editQuote.paymentRequired
          ? `Rule edit scheduled: ${response.editQuote.feeSol} SOL for ${response.editQuote.label.toLowerCase()}.`
          : `Rule edit scheduled for ${response.editQuote.label.toLowerCase()} at no charge.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to edit the rule.");
    }
  }

  return {
    owners,
    selectedOwnerEmail,
    setSelectedOwnerEmail,
    rules,
    drafts,
    extensionSessions,
    selectedRuleId,
    setSelectedRuleId,
    selectedRule,
    activeRules,
    scheduledEditRules,
    pausedRules,
    archivedRules,
    status,
    message,
    realtimeStatus,
    loadRules,
    handleActivateRule,
    handleRequestDeactivation,
    handleConfirmDeactivation,
    handleCancelDeactivation,
    handlePublishDraft,
    handleEditRule
  };
}
