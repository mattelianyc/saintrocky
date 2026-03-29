"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "@saintrocky/api-client";
import { buildExtensionSessionsChannel, buildRulesChannel, createRealtimeClient } from "@saintrocky/realtime";
import { RULE_USER_RULE_STATUS_LABELS, formatCompiledRuleSurfaceLabel } from "@saintrocky/shared";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import { Spinner } from "../../primitives/Spinner/Spinner.jsx";
import { StatusBanner } from "../StatusBanner/StatusBanner.jsx";
import { RuleDetailEditor } from "./RuleDetailEditor.jsx";

export function UserRulesPanel({ refreshToken = 0 }) {
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

  const selectedOwner = useMemo(
    () => owners.find((owner) => owner.email === selectedOwnerEmail) || owners[0] || null,
    [owners, selectedOwnerEmail]
  );
  const selectedRule = useMemo(
    () => rules.find((rule) => rule.ruleId === selectedRuleId) || rules[0] || null,
    [rules, selectedRuleId]
  );
  const activeRules = useMemo(() => rules.filter((rule) => rule.status === "active"), [rules]);
  const scheduledEditRules = useMemo(() => rules.filter((rule) => Boolean(rule.pendingEdit)), [rules]);
  const pausedRules = useMemo(() => rules.filter((rule) => rule.status === "paused"), [rules]);
  const archivedRules = useMemo(() => rules.filter((rule) => rule.status === "archived"), [rules]);

  async function loadRules(nextOwnerEmail = "") {
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
  }

  useEffect(() => {
    loadRules("");
  }, [refreshToken]);

  useEffect(() => {
    let isMounted = true;
    let cleanupRulesSubscription = null;
    let cleanupSessionsSubscription = null;

    async function connectRealtime() {
      try {
        const auth = await api.auth.createRuntimeToken({ runtimeSurface: "web" });
        if (!isMounted) {
          return;
        }

        const realtimeClient = createRealtimeClient({
          clientType: "web",
          authToken: auth.token
        });

        globalThis.window?.postMessage(
          {
            type: "SAINTROCKY_EXTENSION_AUTH_HANDOFF",
            payload: {
              token: auth.token,
              user: auth.user,
              apiBaseUrl:
                globalThis.window?.__SAINTROCKY_API_BASE_URL__ ||
                globalThis.window?.__NEXT_PUBLIC_API_BASE_URL__ ||
                globalThis.window?.location?.origin
            }
          },
          globalThis.window?.location?.origin || "*"
        );

        realtimeClientRef.current = realtimeClient;
        realtimeClient.onConnectionStateChange((connection) => {
          if (isMounted) {
            setRealtimeStatus(connection.state);
          }
        });
        realtimeClient.connect();

        const ownerEmail = selectedOwnerEmail || owners[0]?.email;
        if (!ownerEmail) {
          return;
        }

        cleanupRulesSubscription = realtimeClient.subscribe(buildRulesChannel(ownerEmail), (event) => {
          if (!isMounted || event.type !== "channel.snapshot") {
            return;
          }

          setRules(event.payload?.rules || []);
          setDrafts(event.payload?.drafts || []);
        });

        cleanupSessionsSubscription = realtimeClient.subscribe(buildExtensionSessionsChannel(ownerEmail), (event) => {
          if (!isMounted || event.type !== "channel.snapshot") {
            return;
          }

          setExtensionSessions(event.payload?.sessions || []);
        });
      } catch {
        if (isMounted) {
          setRealtimeStatus("error");
        }
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

  async function handleStatusChange(ruleId, nextStatus) {
    setStatus("submitting");
    setMessage("");

    try {
      await api.rules.updateStatus(ruleId, nextStatus);
      await loadRules(selectedOwnerEmail);
      setMessage(`Rule updated: ${RULE_USER_RULE_STATUS_LABELS[nextStatus] || nextStatus}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to update the rule.");
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
    if (!selectedRule) {
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.editRule(selectedRule.ruleId, payload);
      await loadRules(selectedOwnerEmail);
      setSelectedRuleId(response.rule.ruleId);
      setMessage(
        response.editQuote.paymentRequired
          ? `Rule edit scheduled: $${response.editQuote.feeAmountUsd} for ${response.editQuote.label.toLowerCase()}.`
          : `Rule edit scheduled for ${response.editQuote.label.toLowerCase()} at no charge.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to edit the rule.");
    }
  }

  function renderRuleList(sectionTitle, sectionRules) {
    if (!sectionRules.length) {
      return null;
    }

    return (
      <section className="c-RulesWorkspaceList__section">
        <div className="c-RulesWorkspaceList__sectionHeader">
          <h3>{sectionTitle}</h3>
          <span>{sectionRules.length}</span>
        </div>
        <div className="c-RulesWorkspaceList__items">
          {sectionRules.map((rule) => (
            <button
              key={rule.ruleId}
              type="button"
              className={`c-RulesWorkspaceList__item ${selectedRule?.ruleId === rule.ruleId ? "is-selected" : ""}`}
              onClick={() => setSelectedRuleId(rule.ruleId)}
            >
              <div className="c-RulesWorkspaceList__itemHeader">
                <div>
                  <p className="c-RulesWorkspacePanel__itemEyebrow">
                    {formatCompiledRuleSurfaceLabel(rule.compiledRule)}
                  </p>
                  <strong>{rule.title}</strong>
                </div>
                <span>{RULE_USER_RULE_STATUS_LABELS[rule.status] || rule.status}</span>
              </div>
              <p>{rule.summary}</p>
              <p className="c-RulesWorkspacePanel__meta">
                {rule.pendingEdit
                  ? `Pending edit: ${new Date(rule.pendingEdit.effectiveAt).toLocaleString()}`
                  : `Latest runtime event: ${rule.latestRuntimeEvent?.eventType || "No events yet"}`}
              </p>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="c-RulesWorkspacePanel">
      <StatusBanner
        message={message}
        tone={status === "error" ? "error" : status === "submitting" ? "info" : "success"}
      />

      <div className="c-RulesWorkspacePanel__toolbar">
        <div>
          <p className="c-RulesWorkspacePanel__eyebrow">Current rules</p>
          <h2>Rulebook editor</h2>
          <p>
            Organize, edit, and schedule changes to the active rulebook for{" "}
            {selectedOwner?.displayName || "this member"}.
          </p>
        </div>
        {owners.length > 1 ? (
          <label className="c-RulesWorkspacePanel__selectLabel">
            <span>Member</span>
            <select
              className="c-RulesWorkspacePanel__select"
              value={selectedOwnerEmail}
              onChange={(event) => {
                setSelectedOwnerEmail(event.target.value);
                loadRules(event.target.value);
              }}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.email}>
                  {owner.displayName} ({owner.email})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {status === "loading" ? (
        <div className="c-RulesWorkspacePanel__loading">
          <Spinner />
        </div>
      ) : (
        <div className="c-RulesWorkspacePanel__stack c-RulesWorkspacePanel__stack--lg">
          <div className="c-RulesWorkspaceSummaryGrid">
            <Card className="c-RulesWorkspaceSummaryCard">
              <span>Active</span>
              <strong>{activeRules.length}</strong>
            </Card>
            <Card className="c-RulesWorkspaceSummaryCard">
              <span>Scheduled edits</span>
              <strong>{scheduledEditRules.length}</strong>
            </Card>
            <Card className="c-RulesWorkspaceSummaryCard">
              <span>Drafts ready</span>
              <strong>{drafts.filter((draft) => draft.status === "ready_for_activation").length}</strong>
            </Card>
            <Card className="c-RulesWorkspaceSummaryCard">
              <span>Browser runtimes</span>
              <strong>{extensionSessions.filter((session) => session.connectionState === "connected").length}</strong>
            </Card>
          </div>

          <div className="c-RulesWorkspaceCurrentGrid">
            <div className="c-RulesWorkspaceList">
              {renderRuleList("Scheduled changes", scheduledEditRules)}
              {renderRuleList("Active rules", activeRules)}
              {renderRuleList("Paused rules", pausedRules)}
              {renderRuleList("Archived rules", archivedRules)}
              {!rules.length ? (
                <p className="c-RulesWorkspacePanel__empty">No user rules yet for this member.</p>
              ) : null}
            </div>

            <RuleDetailEditor
              rule={selectedRule}
              submitting={status === "submitting"}
              onSubmitEdit={handleEditRule}
              onStatusChange={handleStatusChange}
            />
          </div>

          <section className="c-RulesWorkspacePanel__stack">
            <div className="c-RulesWorkspaceList__sectionHeader">
              <h3>AI drafts</h3>
              <span>{drafts.length}</span>
            </div>
            {drafts.length ? (
              <div className="c-RulesWorkspaceDraftGrid">
                {drafts.map((draft) => (
                  <Card key={draft.id} className="c-RulesWorkspacePanel__item">
                    <div className="c-RulesWorkspacePanel__itemHeader">
                      <strong>{draft.naturalLanguageDraft}</strong>
                      <span>{draft.status}</span>
                    </div>
                    <p className="c-RulesWorkspacePanel__meta">
                      Confidence: {draft.confidenceScore} · Surface:{" "}
                      {formatCompiledRuleSurfaceLabel(draft.compiledRule)}
                    </p>
                    {draft.status === "ready_for_activation" ? (
                      <div className="c-RulesWorkspacePanel__actions">
                        <Button onClick={() => handlePublishDraft(draft.id)}>Activate draft</Button>
                      </div>
                    ) : (
                      <p className="c-RulesWorkspacePanel__meta">
                        Continue this draft in the AI tab if it still needs clarification.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="c-RulesWorkspacePanel__empty">No drafts yet for this member.</p>
            )}
          </section>

          <section className="c-RulesWorkspacePanel__stack">
            <div className="c-RulesWorkspaceList__sectionHeader">
              <h3>Connected browser runtimes</h3>
              <span>{realtimeStatus}</span>
            </div>
            {extensionSessions.length ? (
              <div className="c-RulesWorkspaceDraftGrid">
                {extensionSessions.map((session) => (
                  <Card key={session.sessionId} className="c-RulesWorkspacePanel__item">
                    <div className="c-RulesWorkspacePanel__itemHeader">
                      <strong>{session.browserName || "Browser runtime"}</strong>
                      <span>{session.connectionState}</span>
                    </div>
                    <p className="c-RulesWorkspacePanel__meta">
                      {session.platform || "Unknown platform"} · {session.extensionVersion || "Unknown version"}
                    </p>
                    <p className="c-RulesWorkspacePanel__meta">
                      Assignments: {session.runtimeState?.assignmentCount || 0} · Status:{" "}
                      {session.runtimeState?.assignmentCount > 0 ? "monitoring" : "idle"}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="c-RulesWorkspacePanel__empty">No connected browser runtime yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
