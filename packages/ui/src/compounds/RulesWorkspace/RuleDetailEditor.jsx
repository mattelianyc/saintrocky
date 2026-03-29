"use client";

import { useEffect, useMemo, useState } from "react";

import {
  RULE_EDIT_TIMING_OPTION_LABELS,
  RULE_USER_RULE_STATUS_LABELS,
  formatCompiledRuleSurfaceLabel,
  getRuleEditTimingQuote,
  getRuleTemplateById
} from "@saintrocky/shared";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";

function getFieldInputProps(field) {
  if (field.type === "number") {
    return { type: "number", inputMode: "numeric" };
  }

  if (field.type === "time") {
    return { type: "time" };
  }

  return { type: "text" };
}

export function RuleDetailEditor({ rule, submitting, onSubmitEdit, onStatusChange }) {
  const template = useMemo(
    () => (rule?.templateId ? getRuleTemplateById(rule.templateId) : null),
    [rule?.templateId]
  );
  const [config, setConfig] = useState(rule?.config || {});
  const [editTimingOption, setEditTimingOption] = useState("delay_24h");

  useEffect(() => {
    setConfig(rule?.pendingEdit?.config || rule?.config || {});
    setEditTimingOption(rule?.pendingEdit?.timingOption || "delay_24h");
  }, [rule?.ruleId, rule?.pendingEdit?.timingOption]);

  const editQuote = useMemo(() => getRuleEditTimingQuote(editTimingOption), [editTimingOption]);

  if (!rule) {
    return (
      <Card className="c-RulesWorkspaceEditor">
        <div className="c-RulesWorkspaceEditor__empty">
          <h3>Select a rule</h3>
          <p>Pick a rule from the left to inspect it, edit its config, or schedule a change.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="c-RulesWorkspaceEditor">
      <div className="c-RulesWorkspaceEditor__header">
        <div>
          <p className="c-RulesWorkspacePanel__itemEyebrow">
            {formatCompiledRuleSurfaceLabel(rule.compiledRule)}
          </p>
          <h3>{rule.title}</h3>
          <p className="c-RulesWorkspaceEditor__summary">{rule.summary}</p>
        </div>
        <span className="c-RulesWorkspaceEditor__status">
          {RULE_USER_RULE_STATUS_LABELS[rule.status] || rule.status}
        </span>
      </div>

      <div className="c-RulesWorkspaceEditor__metaGrid">
        <div>
          <span>Latest event</span>
          <strong>{rule.latestRuntimeEvent?.eventType || "No events yet"}</strong>
        </div>
        <div>
          <span>Pending edit</span>
          <strong>{rule.pendingEdit ? RULE_EDIT_TIMING_OPTION_LABELS[rule.pendingEdit.timingOption] : "None"}</strong>
        </div>
      </div>

      {rule.pendingEdit ? (
        <div className="c-RulesWorkspaceEditor__pendingEdit">
          <strong>Scheduled change</strong>
          <p>{rule.pendingEdit.summary}</p>
          <span>
            Effective {new Date(rule.pendingEdit.effectiveAt).toLocaleString()} ·{" "}
            {rule.pendingEdit.paymentRequired ? `$${rule.pendingEdit.feeAmountUsd}` : "Free"}
          </span>
        </div>
      ) : null}

      {template ? (
        <>
          <div className="c-RulesWorkspaceEditor__fieldGrid">
            {template.inputSchema.fields.map((field) => (
              <label key={field.key} className="c-RulesWorkspacePanel__field">
                <span>{field.label}</span>
                <input
                  className="c-RulesWorkspacePanel__input"
                  {...getFieldInputProps(field)}
                  value={config[field.key] ?? ""}
                  onChange={(event) =>
                    setConfig((currentValue) => ({
                      ...currentValue,
                      [field.key]:
                        field.type === "number" ? Number(event.target.value || 0) : event.target.value
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="c-RulesWorkspaceEditor__timingStack">
            <div>
              <p className="c-RulesWorkspacePanel__itemEyebrow">Edit activation timing</p>
              <h4>Choose how fast this edit should take effect</h4>
            </div>
            <div className="c-RulesWorkspaceEditor__timingOptions">
              {Object.entries(RULE_EDIT_TIMING_OPTION_LABELS).map(([timingOption, label]) => {
                const quote = getRuleEditTimingQuote(timingOption);
                return (
                  <button
                    key={timingOption}
                    type="button"
                    className={`c-RulesWorkspaceEditor__timingOption ${
                      editTimingOption === timingOption ? "is-selected" : ""
                    }`}
                    onClick={() => setEditTimingOption(timingOption)}
                  >
                    <strong>{label}</strong>
                    <span>{quote.paymentRequired ? `$${quote.feeAmountUsd}` : "Free"}</span>
                    <span>{quote.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="c-RulesWorkspaceEditor__quote">
            <strong>
              {editQuote.paymentRequired ? `$${editQuote.feeAmountUsd}` : "Free"} · {editQuote.label}
            </strong>
            <span>Effective {new Date(editQuote.effectiveAt).toLocaleString()}</span>
          </div>

          <div className="c-RulesWorkspacePanel__actions">
            <Button
              onClick={() => onSubmitEdit({ config, editTimingOption })}
              loading={submitting}
              loadingLabel="Saving rule"
            >
              Save edit
            </Button>
            {rule.status !== "active" ? (
              <Button variant="secondary" onClick={() => onStatusChange(rule.ruleId, "active")}>
                Activate
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => onStatusChange(rule.ruleId, "paused")}>
                Pause
              </Button>
            )}
            {rule.status !== "archived" ? (
              <Button variant="ghost" onClick={() => onStatusChange(rule.ruleId, "archived")}>
                Archive
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <div className="c-RulesWorkspaceEditor__empty">
          <h4>Inline editing is unavailable</h4>
          <p>AI-authored rules need to be revised through the AI authoring flow until we define editable schemas for them.</p>
        </div>
      )}
    </Card>
  );
}
