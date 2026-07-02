"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@saintrocky/icons";

import { Spinner } from "../../primitives/Spinner/Spinner.jsx";
import { StatusBanner } from "../StatusBanner/StatusBanner.jsx";
import { TacticsTable } from "../TacticsTable/TacticsTable.jsx";
import { DraftInspectDialog } from "../TacticsTable/DraftInspectDialog.jsx";
import { RuleDeactivateDialog } from "../TacticsTable/RuleDeactivateDialog.jsx";
import { RuleInspectDialog } from "../TacticsTable/RuleInspectDialog.jsx";
import {
  buildActiveRuleColumns,
  buildDraftColumns,
  buildInactiveRuleColumns
} from "../TacticsTable/tacticsColumns.jsx";
import { useRulesWorkspaceData } from "./useRulesWorkspaceData.js";

const TAB_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

export function TacticsWorkspace() {
  const [activeTab, setActiveTab] = useState("active");
  const [inspectRule, setInspectRule] = useState(null);
  const [deactivateRule, setDeactivateRule] = useState(null);
  const [inspectDraft, setInspectDraft] = useState(null);

  const data = useRulesWorkspaceData();

  const inactiveRules = useMemo(
    () => [...data.pausedRules, ...data.archivedRules],
    [data.pausedRules, data.archivedRules]
  );

  const activeColumns = useMemo(
    () =>
      buildActiveRuleColumns({
        onInspect: setInspectRule,
        onDeactivate: setDeactivateRule
      }),
    []
  );

  const inactiveColumns = buildInactiveRuleColumns({
    onInspect: setInspectRule,
    onActivate: data.handleActivateRule
  });

  const draftColumns = buildDraftColumns({
    onInspect: setInspectDraft,
    onPublish: data.handlePublishDraft
  });

  const handleInspectDialogOpenChange = useCallback((nextOpen) => {
    if (!nextOpen) setInspectRule(null);
  }, []);

  const handleDeactivateDialogOpenChange = useCallback((nextOpen) => {
    if (!nextOpen) setDeactivateRule(null);
  }, []);

  const handleDraftDialogOpenChange = useCallback((nextOpen) => {
    if (!nextOpen) setInspectDraft(null);
  }, []);

  const filterOptions = [
    { value: "active", label: "Active", icon: "tactics" },
    { value: "inactive", label: "Inactive", icon: "pause" },
    { value: "drafts", label: "Drafts", icon: "blog" }
  ];

  const toolbarFilters = (
    <div className="c-TacticsWorkspace__filterBar" aria-label="Rule filters">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`c-TacticsWorkspace__filterButton ${
            activeTab === option.value ? "is-active" : ""
          }`}
          onClick={() => setActiveTab(option.value)}
          aria-pressed={activeTab === option.value}
          title={option.label}
        >
          <Icon name={option.icon} size={15} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );

  function renderActiveContent() {
    if (data.status === "loading") {
      return (
        <div className="c-RulesWorkspacePanel__loading">
          <Spinner />
        </div>
      );
    }

    const activeData = [...data.scheduledEditRules, ...data.activeRules];

    switch (activeTab) {
      case "active":
        return (
          <TacticsTable
            columns={activeColumns}
            data={activeData}
            emptyMessage="No active rules yet for this member."
            filterPlaceholder="Filter active rules\u2026"
            toolbarFilters={toolbarFilters}
          />
        );
      case "inactive":
        return (
          <TacticsTable
            columns={inactiveColumns}
            data={inactiveRules}
            emptyMessage="No paused or archived rules."
            filterPlaceholder="Filter inactive rules\u2026"
            toolbarFilters={toolbarFilters}
          />
        );
      case "drafts":
        return (
          <TacticsTable
            columns={draftColumns}
            data={data.drafts}
            emptyMessage="No AI drafts yet for this member."
            filterPlaceholder="Filter drafts\u2026"
            toolbarFilters={toolbarFilters}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="c-RulesWorkspace c-TacticsWorkspace c-CompactDashboardPage">
      {data.message ? (
        <StatusBanner
          message={data.message}
          tone={data.status === "error" ? "error" : data.status === "submitting" ? "info" : "success"}
        />
      ) : null}

      <div className="c-TacticsWorkspace__toolbar">
        {data.owners.length > 1 ? (
          <label className="c-CompactDashboardSelectLabel c-TacticsWorkspace__memberSelect">
            <span>Member</span>
            <select
              className="c-CompactDashboardSelect"
              value={data.selectedOwnerEmail}
              onChange={(event) => {
                data.setSelectedOwnerEmail(event.target.value);
                data.loadRules(event.target.value);
              }}
            >
              {data.owners.map((owner) => (
                <option key={owner.id} value={owner.email}>
                  {owner.displayName} ({owner.email})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} {...TAB_ANIMATION} className="c-RulesWorkspace__content">
          {renderActiveContent()}
        </motion.div>
      </AnimatePresence>

      <RuleInspectDialog
        open={inspectRule !== null}
        onOpenChange={handleInspectDialogOpenChange}
        rule={inspectRule}
        submitting={data.status === "submitting"}
        onSubmitEdit={data.handleEditRule}
        onActivateRule={data.handleActivateRule}
        onRequestDeactivation={data.handleRequestDeactivation}
        onConfirmDeactivation={data.handleConfirmDeactivation}
        onCancelDeactivation={data.handleCancelDeactivation}
      />

      <RuleDeactivateDialog
        open={deactivateRule !== null}
        onOpenChange={handleDeactivateDialogOpenChange}
        rule={deactivateRule}
        submitting={data.status === "submitting"}
        onRequestDeactivation={data.handleRequestDeactivation}
        onConfirmDeactivation={data.handleConfirmDeactivation}
        onCancelDeactivation={data.handleCancelDeactivation}
      />

      <DraftInspectDialog
        open={inspectDraft !== null}
        onOpenChange={handleDraftDialogOpenChange}
        draft={inspectDraft}
        submitting={data.status === "submitting"}
        onPublishDraft={data.handlePublishDraft}
      />
    </div>
  );
}
