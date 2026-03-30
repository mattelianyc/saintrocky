"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  RULE_EDIT_TIMING_OPTION_LABELS,
  RULE_USER_RULE_STATUS_LABELS,
  formatCompiledRuleSurfaceLabel,
  getRuleEditTimingQuote,
  getRuleTemplateById
} from "@saintrocky/shared";
import {
  calculateLockedStake,
  LAMPORTS_PER_SOL
} from "@saintrocky/fuckyoupayme";

import { Button } from "../../primitives/Button/Button.jsx";
import { RuleChangeRequestCard } from "./RuleChangeRequestCard.jsx";

const STEP_ANIMATION = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
};

const STEPS = [
  { key: "overview", label: "Overview" },
  { key: "configure", label: "Configure" },
  { key: "timing", label: "Timing" },
  { key: "deactivation", label: "Deactivation" }
];

function getFieldInputProps(field) {
  if (field.type === "number") return { type: "number", inputMode: "numeric" };
  if (field.type === "time") return { type: "time" };
  return { type: "text" };
}

function StepOverview({ rule, effectiveProblemIndex, effectiveLockedStakeLamports }) {
  return (
    <div className="c-RuleWizard__stepContent">
      <div className="c-RuleWizard__overviewHeader">
        <div>
          <p className="c-TacticsTable__eyebrow">{formatCompiledRuleSurfaceLabel(rule.compiledRule)}</p>
          <h3 className="c-RuleWizard__title">{rule.title}</h3>
          <p className="c-RuleWizard__summary">{rule.summary}</p>
        </div>
        <span className="c-TacticsTable__statusBadge c-TacticsTable__statusBadge--active">
          {RULE_USER_RULE_STATUS_LABELS[rule.status] || rule.status}
        </span>
      </div>

      <div className="c-RuleWizard__metaGrid">
        <div className="c-RuleWizard__metaItem">
          <span>Latest event</span>
          <strong>{rule.latestRuntimeEvent?.eventType || "No events yet"}</strong>
        </div>
        <div className="c-RuleWizard__metaItem">
          <span>Pending edit</span>
          <strong>
            {rule.pendingEdit ? RULE_EDIT_TIMING_OPTION_LABELS[rule.pendingEdit.timingOption] : "None"}
          </strong>
        </div>
        <div className="c-RuleWizard__metaItem">
          <span>Problem index</span>
          <strong>{effectiveProblemIndex}</strong>
        </div>
        <div className="c-RuleWizard__metaItem">
          <span>Locked stake</span>
          <strong>{(effectiveLockedStakeLamports / LAMPORTS_PER_SOL).toFixed(2)} SOL</strong>
        </div>
      </div>

      {rule.pendingEdit ? (
        <div className="c-RuleWizard__pendingBanner">
          <strong>Scheduled change</strong>
          <p>{rule.pendingEdit.summary}</p>
          <span>
            Effective {new Date(rule.pendingEdit.effectiveAt).toLocaleString()} &middot;{" "}
            {rule.pendingEdit.paymentRequired ? `${rule.pendingEdit.feeSol} SOL` : "Free"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function StepConfigure({ template, config, onConfigChange }) {
  if (!template) {
    return (
      <div className="c-RuleWizard__stepContent">
        <div className="c-RuleWizard__emptyStep">
          <h4>Configuration unavailable</h4>
          <p>AI-authored rules need to be revised through the AI authoring flow until editable schemas are defined.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="c-RuleWizard__stepContent">
      <div className="c-RuleWizard__fieldGrid">
        {template.inputSchema.fields.map((field) => (
          <label key={field.key} className="c-RuleWizard__field">
            <span>{field.label}</span>
            <input
              className="c-RuleWizard__input"
              {...getFieldInputProps(field)}
              value={config[field.key] ?? ""}
              onChange={(event) =>
                onConfigChange((current) => ({
                  ...current,
                  [field.key]: field.type === "number" ? Number(event.target.value || 0) : event.target.value
                }))
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function StepTiming({
  rule,
  editTimingOption,
  onEditTimingOptionChange,
  editQuote,
  config,
  problemIndex,
  submitting,
  onSubmitEdit,
  onActivateRule,
  template
}) {
  if (!template) {
    return (
      <div className="c-RuleWizard__stepContent">
        <div className="c-RuleWizard__emptyStep">
          <h4>Timing unavailable</h4>
          <p>Configure step must be available before scheduling an edit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="c-RuleWizard__stepContent">
      <div>
        <p className="c-TacticsTable__eyebrow">Edit activation timing</p>
        <h4 className="c-RuleWizard__stepHeading">Choose how fast this edit should take effect</h4>
      </div>
      <div className="c-RuleWizard__timingGrid">
        {Object.entries(RULE_EDIT_TIMING_OPTION_LABELS).map(([option, label]) => {
          const quote = getRuleEditTimingQuote(option);
          return (
            <button
              key={option}
              type="button"
              className={`c-RuleWizard__timingCard ${editTimingOption === option ? "is-selected" : ""}`}
              onClick={() => onEditTimingOptionChange(option)}
            >
              <strong>{label}</strong>
              <span>{quote.paymentRequired ? `${quote.feeSol} SOL` : "Free"}</span>
              <span className="c-RuleWizard__timingDesc">{quote.description}</span>
            </button>
          );
        })}
      </div>

      <div className="c-RuleWizard__quoteBar">
        <strong>
          {editQuote.paymentRequired ? `${editQuote.feeSol} SOL` : "Free"} &middot; {editQuote.label}
        </strong>
        <span>Effective {new Date(editQuote.effectiveAt).toLocaleString()}</span>
      </div>

      <div className="c-RuleWizard__actions">
        <Button
          onClick={() => onSubmitEdit({ config, problemIndex, editTimingOption })}
          loading={submitting}
          loadingLabel="Saving rule"
        >
          Save edit
        </Button>
        {rule.status !== "active" ? (
          <Button variant="secondary" onClick={() => onActivateRule?.(rule.ruleId)}>
            Activate
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function StepDeactivation({
  rule,
  effectiveProblemIndex,
  effectiveLockedStakeLamports,
  submitting,
  pendingDeactivationRequest,
  pendingActionTitle,
  onRequestDeactivation,
  onConfirmDeactivation,
  onCancelDeactivation
}) {
  if (rule.status !== "active") {
    return (
      <div className="c-RuleWizard__stepContent">
        <div className="c-RuleWizard__emptyStep">
          <h4>Rule is not active</h4>
          <p>Deactivation flows are only available for active rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="c-RuleWizard__stepContent">
      {pendingDeactivationRequest ? (
        <RuleChangeRequestCard
          title={pendingActionTitle}
          pendingRequest={pendingDeactivationRequest}
          problemIndex={rule.problemIndex ?? effectiveProblemIndex}
          lockedStakeLamports={rule.lockedStakeLamports ?? effectiveLockedStakeLamports}
          submitting={submitting}
          onConfirmRequest={() =>
            onConfirmDeactivation?.(rule.ruleId, pendingDeactivationRequest.requestId)
          }
          onCancelRequest={() =>
            onCancelDeactivation?.(rule.ruleId, pendingDeactivationRequest.requestId)
          }
        />
      ) : (
        <div className="c-RuleWizard__deactivationGrid">
          <RuleChangeRequestCard
            title="Pause rule"
            problemIndex={rule.problemIndex ?? effectiveProblemIndex}
            lockedStakeLamports={rule.lockedStakeLamports ?? effectiveLockedStakeLamports}
            submitting={submitting}
            onStartRequest={() => onRequestDeactivation?.(rule.ruleId, "paused")}
          />
          <RuleChangeRequestCard
            title="Archive rule"
            problemIndex={rule.problemIndex ?? effectiveProblemIndex}
            lockedStakeLamports={rule.lockedStakeLamports ?? effectiveLockedStakeLamports}
            submitting={submitting}
            onStartRequest={() => onRequestDeactivation?.(rule.ruleId, "archived")}
          />
        </div>
      )}
    </div>
  );
}

export function RuleDetailEditor({
  rule,
  problemIndex = 50,
  submitting,
  onSubmitEdit,
  onActivateRule,
  onRequestDeactivation,
  onConfirmDeactivation,
  onCancelDeactivation
}) {
  const [activeStep, setActiveStep] = useState("overview");
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

  useEffect(() => {
    setActiveStep("overview");
  }, [rule?.ruleId]);

  const editQuote = useMemo(() => getRuleEditTimingQuote(editTimingOption), [editTimingOption]);
  const effectiveProblemIndex = rule?.pendingEdit?.problemIndex ?? problemIndex;
  const effectiveLockedStakeLamports =
    rule?.pendingEdit?.lockedStakeLamports ??
    rule?.lockedStakeLamports ??
    calculateLockedStake(effectiveProblemIndex);
  const pendingDeactivationRequest = rule?.pendingRuleChangeRequests?.deactivation || null;
  const pendingTargetStatus = pendingDeactivationRequest?.metadata?.targetStatus || "paused";
  const pendingActionTitle = pendingTargetStatus === "archived" ? "Archive rule" : "Pause rule";

  const availableSteps = useMemo(() => {
    if (!rule) return [];
    const steps = [STEPS[0]];
    if (template) {
      steps.push(STEPS[1], STEPS[2]);
    }
    if (rule.status === "active") {
      steps.push(STEPS[3]);
    }
    return steps;
  }, [rule, template]);

  if (!rule) return null;

  function renderStep() {
    switch (activeStep) {
      case "overview":
        return (
          <StepOverview
            rule={rule}
            effectiveProblemIndex={effectiveProblemIndex}
            effectiveLockedStakeLamports={effectiveLockedStakeLamports}
          />
        );
      case "configure":
        return <StepConfigure template={template} config={config} onConfigChange={setConfig} />;
      case "timing":
        return (
          <StepTiming
            rule={rule}
            editTimingOption={editTimingOption}
            onEditTimingOptionChange={setEditTimingOption}
            editQuote={editQuote}
            config={config}
            problemIndex={problemIndex}
            submitting={submitting}
            onSubmitEdit={onSubmitEdit}
            onActivateRule={onActivateRule}
            template={template}
          />
        );
      case "deactivation":
        return (
          <StepDeactivation
            rule={rule}
            effectiveProblemIndex={effectiveProblemIndex}
            effectiveLockedStakeLamports={effectiveLockedStakeLamports}
            submitting={submitting}
            pendingDeactivationRequest={pendingDeactivationRequest}
            pendingActionTitle={pendingActionTitle}
            onRequestDeactivation={onRequestDeactivation}
            onConfirmDeactivation={onConfirmDeactivation}
            onCancelDeactivation={onCancelDeactivation}
          />
        );
      default:
        return null;
    }
  }

  const currentStepIndex = availableSteps.findIndex((step) => step.key === activeStep);
  const hasPrevious = currentStepIndex > 0;
  const hasNext = currentStepIndex < availableSteps.length - 1;

  return (
    <div className="c-RuleWizard">
      <nav className="c-RuleWizard__nav">
        {availableSteps.map((step, index) => (
          <button
            key={step.key}
            type="button"
            className={`c-RuleWizard__navItem ${activeStep === step.key ? "is-active" : ""} ${index < currentStepIndex ? "is-completed" : ""}`}
            onClick={() => setActiveStep(step.key)}
          >
            <span className="c-RuleWizard__navNumber">{index + 1}</span>
            <span className="c-RuleWizard__navLabel">{step.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div key={activeStep} {...STEP_ANIMATION}>
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="c-RuleWizard__footer">
        <Button
          variant="ghost"
          onClick={() => setActiveStep(availableSteps[currentStepIndex - 1]?.key)}
          disabled={!hasPrevious}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => setActiveStep(availableSteps[currentStepIndex + 1]?.key)}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
