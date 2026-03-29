"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@saintrocky/api-client";
import { RULE_TEMPLATE_CATEGORY_LABELS } from "@saintrocky/shared";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import { Spinner } from "../../primitives/Spinner/Spinner.jsx";
import { StatusBanner } from "../StatusBanner/StatusBanner.jsx";

function getFieldInputProps(field) {
  if (field.type === "number") {
    return { type: "number", inputMode: "numeric" };
  }

  if (field.type === "time") {
    return { type: "time" };
  }

  return { type: "text" };
}

export function RuleTemplatesPanel({ onRuleCreated }) {
  const [owners, setOwners] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.templateId === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    async function loadTemplates() {
      setStatus("loading");
      setMessage("");

      try {
        const response = await api.rules.listTemplates();
        setOwners(response.authors || []);
        setTemplates(response.templates || []);
        setSelectedOwnerEmail(response.authors?.[0]?.email || "");
        setSelectedTemplateId(response.templates?.[0]?.templateId || "");
        setConfig(response.templates?.[0]?.defaultConfig || {});
        setStatus("idle");
      } catch (error) {
        setStatus("error");
        setMessage(error?.message || "Unable to load rule templates.");
      }
    }

    loadTemplates();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setConfig(selectedTemplate.defaultConfig || {});
  }, [selectedTemplate?.templateId]);

  async function handleCreateRule() {
    setStatus("submitting");
    setMessage("");

    try {
      await api.rules.createFromTemplate({
        ownerEmail: selectedOwnerEmail || undefined,
        templateId: selectedTemplate.templateId,
        config
      });
      setStatus("idle");
      setMessage("Template added to current rules.");
      if (typeof onRuleCreated === "function") {
        onRuleCreated();
      }
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to create the rule from this template.");
    }
  }

  return (
    <div className="c-RulesWorkspacePanel">
      <StatusBanner
        message={message}
        tone={status === "error" ? "error" : status === "submitting" ? "info" : "success"}
      />

      <div className="c-RulesWorkspacePanel__toolbar">
        <div>
          <p className="c-RulesWorkspacePanel__eyebrow">Rule templates</p>
          <h2>Start from proven defaults</h2>
          <p>Pick an obvious trader rule, tune the inputs, and activate it without typing from scratch.</p>
        </div>
        {owners.length > 1 ? (
          <label className="c-RulesWorkspacePanel__selectLabel">
            <span>Member</span>
            <select
              className="c-RulesWorkspacePanel__select"
              value={selectedOwnerEmail}
              onChange={(event) => setSelectedOwnerEmail(event.target.value)}
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
        <div className="c-RulesWorkspacePanel__grid">
          <section className="c-RulesWorkspacePanel__stack">
            <h3>Template library</h3>
            {templates.map((template) => (
              <button
                key={template.templateId}
                type="button"
                className={`c-RulesWorkspacePanel__templateButton ${
                  template.templateId === selectedTemplateId ? "is-selected" : ""
                }`}
                onClick={() => setSelectedTemplateId(template.templateId)}
              >
                <span>{RULE_TEMPLATE_CATEGORY_LABELS[template.category] || template.category}</span>
                <strong>{template.title}</strong>
                <span>{template.summary}</span>
              </button>
            ))}
          </section>

          <section className="c-RulesWorkspacePanel__stack">
            {selectedTemplate ? (
              <Card className="c-RulesWorkspacePanel__item">
                <div className="c-RulesWorkspacePanel__itemHeader">
                  <div>
                    <p className="c-RulesWorkspacePanel__itemEyebrow">
                      {RULE_TEMPLATE_CATEGORY_LABELS[selectedTemplate.category] || selectedTemplate.category}
                    </p>
                    <strong>{selectedTemplate.title}</strong>
                  </div>
                </div>
                <p>{selectedTemplate.summary}</p>
                <div className="c-RulesWorkspacePanel__fieldGrid">
                  {selectedTemplate.inputSchema.fields.map((field) => (
                    <label key={field.key} className="c-RulesWorkspacePanel__field">
                      <span>{field.label}</span>
                      <input
                        className="c-RulesWorkspacePanel__input"
                        {...getFieldInputProps(field)}
                        value={config[field.key] ?? ""}
                        onChange={(event) =>
                          setConfig((currentValue) => ({
                            ...currentValue,
                            [field.key]: event.target.value
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="c-RulesWorkspacePanel__actions">
                  <Button
                    onClick={handleCreateRule}
                    loading={status === "submitting"}
                    loadingLabel="Creating rule"
                  >
                    Add to current rules
                  </Button>
                </div>
              </Card>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
