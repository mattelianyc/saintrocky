"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { api } from "@saintrocky/api-client";
import { RULE_TEMPLATE_CATEGORY_LABELS } from "@saintrocky/shared";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import { Spinner } from "../../primitives/Spinner/Spinner.jsx";
import { StatusBanner } from "../StatusBanner/StatusBanner.jsx";

const STAGGER_ITEM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 }
};

const CONFIG_REVEAL = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

function getFieldInputProps(field) {
  if (field.type === "number") {
    return { type: "number", inputMode: "numeric" };
  }

  if (field.type === "time") {
    return { type: "time" };
  }

  return { type: "text" };
}

export function RuleTemplatesPanel({ problemIndex = 50, onProblemIndexChange, onRuleCreated, existingRules = [] }) {
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

  const matchingExistingRule = useMemo(
    () =>
      selectedTemplate
        ? existingRules.find((rule) => rule.templateId === selectedTemplate.templateId) || null
        : null,
    [existingRules, selectedTemplate]
  );

  const isUpdatingExistingRule = matchingExistingRule !== null;

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
        onProblemIndexChange?.(50);
        setStatus("idle");
      } catch (error) {
        setStatus("error");
        setMessage(error?.message || "Unable to load rule templates.");
      }
    }

    loadTemplates();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) return;

    const existingMatch = existingRules.find((rule) => rule.templateId === selectedTemplate.templateId);
    if (existingMatch) {
      setConfig(existingMatch.pendingEdit?.config || existingMatch.config || selectedTemplate.defaultConfig || {});
      onProblemIndexChange?.(existingMatch.problemIndex ?? 50);
    } else {
      setConfig(selectedTemplate.defaultConfig || {});
      onProblemIndexChange?.(50);
    }
  }, [selectedTemplate?.templateId, existingRules]);

  async function handleCreateRule() {
    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.createFromTemplate({
        ownerEmail: selectedOwnerEmail || undefined,
        templateId: selectedTemplate.templateId,
        config,
        problemIndex
      });
      setStatus("idle");
      setMessage(
        response.merged
          ? "Existing rule updated with new configuration."
          : "Template added to current rules."
      );
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
            {templates.map((template, index) => {
              const hasExistingRule = existingRules.some((rule) => rule.templateId === template.templateId);
              return (
                <motion.button
                  key={template.templateId}
                  type="button"
                  className={`c-RulesWorkspacePanel__templateButton ${
                    template.templateId === selectedTemplateId ? "is-selected" : ""
                  } ${hasExistingRule ? "has-existing-rule" : ""}`}
                  onClick={() => setSelectedTemplateId(template.templateId)}
                  {...STAGGER_ITEM}
                  transition={{ ...STAGGER_ITEM.transition, delay: index * 0.04 }}
                >
                  <span>{RULE_TEMPLATE_CATEGORY_LABELS[template.category] || template.category}</span>
                  <strong>{template.title}</strong>
                  <span>{template.summary}</span>
                  {hasExistingRule ? <span className="c-RulesWorkspacePanel__activeTag">Active</span> : null}
                </motion.button>
              );
            })}
          </section>

          <AnimatePresence mode="wait">
            {selectedTemplate ? (
              <motion.section key={selectedTemplate.templateId} className="c-RulesWorkspacePanel__stack" {...CONFIG_REVEAL}>
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
                  {isUpdatingExistingRule ? (
                    <p className="c-RulesWorkspacePanel__mergeHint">
                      An active rule from this template already exists. Changes that expand protection will apply immediately at no charge.
                    </p>
                  ) : null}
                  <div className="c-RulesWorkspacePanel__actions">
                    <Button
                      onClick={handleCreateRule}
                      loading={status === "submitting"}
                      loadingLabel={isUpdatingExistingRule ? "Updating rule" : "Creating rule"}
                    >
                      {isUpdatingExistingRule ? "Update existing rule" : "Add to current rules"}
                    </Button>
                  </div>
                </Card>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
