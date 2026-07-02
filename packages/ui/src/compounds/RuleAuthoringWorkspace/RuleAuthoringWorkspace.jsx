"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { api } from "@saintrocky/api-client";
import {
  calculateLockedStake,
  LAMPORTS_PER_SOL
} from "@saintrocky/fuckyoupayme";
import {
  RULE_DRAFT_STATUS_LABELS,
  RULE_ENFORCEMENT_SURFACE_LABELS,
  RULE_RUNTIME_SURFACE_LABELS,
  formatCompiledRuleSurfaceLabel
} from "@saintrocky/shared";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import { Field } from "../../primitives/Field/Field.jsx";
import { Spinner } from "../../primitives/Spinner/Spinner.jsx";
import { ProblemIndexSlider } from "../ProblemIndexSlider/ProblemIndexSlider.jsx";
import { StatusBanner } from "../StatusBanner/StatusBanner.jsx";

const REVIEW_ANIMATION = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

function getToneForStatus(status) {
  if (status === "ready_for_activation") return "success";
  if (status === "rejected_unenforceable") return "error";
  if (status === "needs_clarification") return "warning";
  return "info";
}

function buildClarificationAnswerPayload(questions, answersById) {
  return (questions || [])
    .map((question) => ({
      questionId: question.id,
      answer: (answersById[question.id] || "").trim()
    }))
    .filter((entry) => entry.answer);
}

function formatStatus(status) {
  return RULE_DRAFT_STATUS_LABELS[status] || status;
}

function formatSurface(surface) {
  return (
    RULE_RUNTIME_SURFACE_LABELS[surface] || RULE_ENFORCEMENT_SURFACE_LABELS[surface] || surface || "Not assigned yet"
  );
}

function formatCompiledRuleDomainTargets(compiledRule) {
  const targets = Array.isArray(compiledRule?.targets) ? compiledRule.targets : [];
  return targets.filter((entry) => entry.type === "domain").map((entry) => entry.value);
}

function formatCompiledRuleAppTargets(compiledRule) {
  const targets = Array.isArray(compiledRule?.targets) ? compiledRule.targets : [];
  return targets.filter((entry) => entry.type === "app").map((entry) => entry.value);
}

export function RuleAuthoringWorkspace({
  section,
  showHeader = true,
  problemIndex: externalProblemIndex,
  onProblemIndexChange: externalOnProblemIndexChange
}) {
  const isControlled = externalProblemIndex !== undefined && typeof externalOnProblemIndexChange === "function";

  const [authors, setAuthors] = useState([]);
  const [selectedAuthorEmail, setSelectedAuthorEmail] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [naturalLanguageDraft, setNaturalLanguageDraft] = useState(
    "When I am in deep work mode, block YouTube in the browser unless I pay to override it."
  );
  const [localProblemIndex, setLocalProblemIndex] = useState(externalProblemIndex ?? 50);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const effectiveProblemIndex = isControlled ? externalProblemIndex : localProblemIndex;
  const handleProblemIndexChange = isControlled ? externalOnProblemIndexChange : setLocalProblemIndex;

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedDraftId) || drafts[0] || null,
    [drafts, selectedDraftId]
  );

  async function loadDrafts(authorEmail) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await api.rules.listDrafts(authorEmail);
      setAuthors(response.authors || []);
      setSelectedAuthorEmail(response.author?.email || authorEmail || "");
      setDrafts(response.drafts || []);
      setSelectedDraftId((currentDraftId) =>
        (response.drafts || []).some((draft) => draft.id === currentDraftId)
          ? currentDraftId
          : response.drafts?.[0]?.id || ""
      );
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Unable to load rule drafts right now.");
    }
  }

  useEffect(() => {
    loadDrafts("");
  }, []);

  useEffect(() => {
    if (!selectedDraft) return;
    setNaturalLanguageDraft(selectedDraft.naturalLanguageDraft || "");
    handleProblemIndexChange(selectedDraft.problemIndex ?? 50);
    setClarificationAnswers({});
  }, [selectedDraft]);

  async function handleAuthorChange(event) {
    const nextAuthorEmail = event.target.value;
    setSelectedAuthorEmail(nextAuthorEmail);
    setSelectedDraftId("");
    setClarificationAnswers({});
    await loadDrafts(nextAuthorEmail);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await api.rules.submitDraft({
        authorEmail: selectedAuthorEmail || undefined,
        draftId: selectedDraft?.status === "needs_clarification" ? selectedDraft.id : undefined,
        naturalLanguageDraft,
        problemIndex: effectiveProblemIndex,
        clarificationAnswers: buildClarificationAnswerPayload(
          selectedDraft?.clarificationQuestions,
          clarificationAnswers
        )
      });

      setAuthors(response.authors || []);
      setSelectedAuthorEmail(response.author?.email || selectedAuthorEmail);
      setSelectedDraftId(response.draft.id);
      setDrafts((currentDrafts) => {
        const remainingDrafts = currentDrafts.filter((draft) => draft.id !== response.draft.id);
        return [response.draft, ...remainingDrafts];
      });
      setStatus("idle");
      setMessage(`Rule assessment complete: ${formatStatus(response.draft.status)}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Rule validation failed.");
    }
  }

  return (
    <div className="c-RuleAuthoringWorkspace">
      {showHeader ? (
        <header className="c-RuleAuthoringWorkspace__header">
          <p className="c-RuleAuthoringWorkspace__eyebrow">{section?.title || "Rules"}</p>
          <h1>AI-mediated rule authoring</h1>
          <p>{section?.description}</p>
        </header>
      ) : null}

      <StatusBanner
        message={message}
        tone={status === "error" ? "error" : status === "submitting" ? "info" : "success"}
      />

      <div className="c-RuleAuthoringWorkspace__grid">
        <Card>
          <form className="c-RuleAuthoringWorkspace__form" onSubmit={handleSubmit}>
            <div className="c-RuleAuthoringWorkspace__formHeader">
              <h2>Draft a rule</h2>
              <p>Write the rule in plain English. The API will either clarify it, reject it, or canonize it.</p>
            </div>

            {authors.length > 1 ? (
              <Field.Root className="c-RuleAuthoringWorkspace__field">
                <Field.Label>Testing member</Field.Label>
                <Field.Control>
                  <select
                    className="c-RuleAuthoringWorkspace__select"
                    value={selectedAuthorEmail}
                    onChange={handleAuthorChange}
                  >
                    {authors.map((author) => (
                      <option key={author.id} value={author.email}>
                        {author.displayName} ({author.email})
                      </option>
                    ))}
                  </select>
                </Field.Control>
                <Field.Description>Pick one of the seeded member accounts for local testing.</Field.Description>
              </Field.Root>
            ) : null}

            <Field.Root className="c-RuleAuthoringWorkspace__field">
              <Field.Label>Natural-language rule</Field.Label>
              <Field.Control>
                <textarea
                  className="c-RuleAuthoringWorkspace__textarea"
                  rows={7}
                  value={naturalLanguageDraft}
                  onChange={(event) => setNaturalLanguageDraft(event.target.value)}
                />
              </Field.Control>
              <Field.Description>
                Example: block Reddit during deep work but allow a paid override.
              </Field.Description>
            </Field.Root>

            {!isControlled ? (
              <ProblemIndexSlider value={effectiveProblemIndex} onChange={handleProblemIndexChange} />
            ) : null}

            {selectedDraft?.status === "needs_clarification" ? (
              <div className="c-RuleAuthoringWorkspace__clarificationStack">
                <h3>Clarification questions</h3>
                {selectedDraft.clarificationQuestions.map((question) => (
                  <Field.Root key={question.id} className="c-RuleAuthoringWorkspace__field">
                    <Field.Label>{question.question}</Field.Label>
                    <Field.Control>
                      <textarea
                        className="c-RuleAuthoringWorkspace__textarea"
                        rows={3}
                        value={clarificationAnswers[question.id] || ""}
                        onChange={(event) =>
                          setClarificationAnswers((currentValue) => ({
                            ...currentValue,
                            [question.id]: event.target.value
                          }))
                        }
                      />
                    </Field.Control>
                  </Field.Root>
                ))}
              </div>
            ) : null}

            <Button type="submit" loading={status === "submitting"} loadingLabel="Assessing rule">
              {selectedDraft?.status === "needs_clarification" ? "Submit clarifications" : "Assess rule"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="c-RuleAuthoringWorkspace__reviewStack">
            <div className="c-RuleAuthoringWorkspace__formHeader">
              <h2>Current review</h2>
              <p>Most recent assessment for the selected testing member.</p>
            </div>

            {status === "loading" ? (
              <div className="c-RuleAuthoringWorkspace__loadingState">
                <Spinner />
              </div>
            ) : selectedDraft ? (
              <AnimatePresence mode="wait">
                <motion.div key={selectedDraft.id} {...REVIEW_ANIMATION}>
                  <StatusBanner
                    message={formatStatus(selectedDraft.status)}
                    tone={getToneForStatus(selectedDraft.status)}
                  />

                  <div className="c-RuleAuthoringWorkspace__detailList">
                    <div>
                      <span>Status</span>
                      <strong>{formatStatus(selectedDraft.status)}</strong>
                    </div>
                    <div>
                      <span>Surface</span>
                      <strong>{formatSurface(selectedDraft.enforcementSurface)}</strong>
                    </div>
                    <div>
                      <span>Confidence</span>
                      <strong>{selectedDraft.confidenceScore}</strong>
                    </div>
                    <div>
                      <span>Problem index</span>
                      <strong>{selectedDraft.problemIndex ?? 50}</strong>
                    </div>
                    <div>
                      <span>Locked stake</span>
                      <strong>
                        {(
                          ((selectedDraft.lockedStakeLamports ??
                            calculateLockedStake(selectedDraft.problemIndex ?? 50)) ||
                            0) / LAMPORTS_PER_SOL
                        ).toFixed(2)}{" "}
                        SOL
                      </strong>
                    </div>
                  </div>

                  {selectedDraft.compiledRule ? (
                    <div className="c-RuleAuthoringWorkspace__canonicalCard">
                      <h3>Compiled rule summary</h3>
                      <p>{selectedDraft.compiledRule.summary}</p>
                      <ul className="c-RuleAuthoringWorkspace__noteList">
                        <li>Inferred surfaces: {formatCompiledRuleSurfaceLabel(selectedDraft.compiledRule)}</li>
                        <li>
                          Domain targets: {formatCompiledRuleDomainTargets(selectedDraft.compiledRule).join(", ") || "—"}
                        </li>
                        <li>App targets: {formatCompiledRuleAppTargets(selectedDraft.compiledRule).join(", ") || "—"}</li>
                        <li>Chain constraints: {selectedDraft.compiledRule.chainConstraints?.type || "—"}</li>
                        <li>Schedule type: {selectedDraft.compiledRule.schedule?.type}</li>
                        <li>Enforcement action: {selectedDraft.compiledRule.enforcement?.action}</li>
                        <li>
                          Bypass: {selectedDraft.compiledRule.bypass?.feeModel}
                          {selectedDraft.compiledRule.bypass?.escrowDeductionBps != null
                            ? ` (${selectedDraft.compiledRule.bypass.escrowDeductionBps} bps)`
                            : ""}
                        </li>
                        {selectedDraft.compiledRule.telemetry?.templateId ? (
                          <li>Telemetry template: {selectedDraft.compiledRule.telemetry.templateId}</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}

                  {selectedDraft.validationNotes?.length ? (
                    <div>
                      <h3>Validation notes</h3>
                      <ul className="c-RuleAuthoringWorkspace__noteList">
                        {selectedDraft.validationNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="c-RuleAuthoringWorkspace__emptyState">
                No rule drafts yet for this member. Submit one to start the flow.
              </p>
            )}
          </div>
        </Card>
      </div>

      <section className="c-RuleAuthoringWorkspace__historyGrid">
        {drafts.map((draft, index) => (
          <motion.button
            key={draft.id}
            className="c-RuleAuthoringWorkspace__historyCard"
            type="button"
            onClick={() => setSelectedDraftId(draft.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.18 }}
          >
            <strong>{formatStatus(draft.status)}</strong>
            <span>{draft.naturalLanguageDraft}</span>
          </motion.button>
        ))}
      </section>
    </div>
  );
}
