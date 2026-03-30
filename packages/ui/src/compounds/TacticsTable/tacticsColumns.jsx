"use client";

import { createColumnHelper } from "@tanstack/react-table";

import {
  RULE_USER_RULE_STATUS_LABELS,
  formatCompiledRuleSurfaceLabel
} from "@saintrocky/shared";
import { LAMPORTS_PER_SOL } from "@saintrocky/fuckyoupayme";
import { Icon } from "@saintrocky/icons";

import { Button } from "../../primitives/Button/Button.jsx";

const ruleHelper = createColumnHelper();
const draftHelper = createColumnHelper();

function StatusBadge({ status, variant }) {
  const label = RULE_USER_RULE_STATUS_LABELS[status] || status;
  return <span className={`c-TacticsTable__statusBadge c-TacticsTable__statusBadge--${variant || status}`}>{label}</span>;
}

function TitleCell({ rule }) {
  return (
    <div className="c-TacticsTable__titleCell">
      <span className="c-TacticsTable__eyebrow">{formatCompiledRuleSurfaceLabel(rule.compiledRule)}</span>
      <strong>{rule.title}</strong>
    </div>
  );
}

function PendingCell({ rule }) {
  if (rule.pendingRuleChangeRequests?.deactivation) {
    const targetStatus = rule.pendingRuleChangeRequests.deactivation.metadata?.targetStatus;
    return <span>{RULE_USER_RULE_STATUS_LABELS[targetStatus] || targetStatus} pending</span>;
  }
  if (rule.pendingEdit) {
    return <span>Edit @ {new Date(rule.pendingEdit.effectiveAt).toLocaleDateString()}</span>;
  }
  return <span className="c-TacticsTable__muted">&mdash;</span>;
}

function ActionButton({ icon, tooltip, onClick, disabled }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      leadingIcon={<Icon name={icon} size={16} />}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    />
  );
}

export function buildActiveRuleColumns({ onInspect, onDeactivate }) {
  return [
    ruleHelper.accessor("title", {
      header: "Rule",
      cell: ({ row }) => <TitleCell rule={row.original} />,
      enableGlobalFilter: true
    }),
    ruleHelper.accessor("problemIndex", {
      header: "P-Index",
      cell: ({ getValue }) => getValue() ?? "\u2014"
    }),
    ruleHelper.accessor("lockedStakeLamports", {
      header: "Locked Stake",
      cell: ({ getValue }) => {
        const value = getValue();
        return value != null ? `${(value / LAMPORTS_PER_SOL).toFixed(2)} SOL` : "\u2014";
      }
    }),
    ruleHelper.accessor((row) => row.latestRuntimeEvent?.eventType, {
      id: "latestEvent",
      header: "Latest Event",
      enableSorting: false,
      cell: ({ getValue }) => getValue() || "\u2014"
    }),
    ruleHelper.display({
      id: "pending",
      header: "Pending",
      cell: ({ row }) => <PendingCell rule={row.original} />
    }),
    ruleHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="c-TacticsTable__actions">
          <ActionButton icon="inspect" tooltip="Inspect & edit" onClick={() => onInspect(row.original)} />
          <ActionButton icon="pause" tooltip="Pause or archive" onClick={() => onDeactivate(row.original)} />
        </div>
      )
    })
  ];
}

export function buildInactiveRuleColumns({ onInspect, onActivate }) {
  return [
    ruleHelper.accessor("title", {
      header: "Rule",
      cell: ({ row }) => <TitleCell rule={row.original} />,
      enableGlobalFilter: true
    }),
    ruleHelper.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue()} />
    }),
    ruleHelper.accessor((row) => formatCompiledRuleSurfaceLabel(row.compiledRule), {
      id: "surface",
      header: "Surface",
      enableSorting: false
    }),
    ruleHelper.accessor("summary", {
      header: "Summary",
      enableSorting: false,
      cell: ({ getValue }) => {
        const value = getValue() || "";
        return value.length > 80 ? `${value.slice(0, 80)}\u2026` : value;
      }
    }),
    ruleHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="c-TacticsTable__actions">
          <ActionButton icon="inspect" tooltip="Inspect" onClick={() => onInspect(row.original)} />
          <ActionButton icon="activate" tooltip="Reactivate" onClick={() => onActivate(row.original.ruleId)} />
        </div>
      )
    })
  ];
}

export function buildDraftColumns({ onInspect, onPublish }) {
  return [
    draftHelper.accessor("naturalLanguageDraft", {
      header: "Draft",
      enableGlobalFilter: true,
      cell: ({ getValue }) => {
        const value = getValue() || "";
        return value.length > 100 ? `${value.slice(0, 100)}\u2026` : value;
      }
    }),
    draftHelper.accessor("confidenceScore", {
      header: "Confidence",
      cell: ({ getValue }) => getValue() ?? "\u2014"
    }),
    draftHelper.accessor((row) => formatCompiledRuleSurfaceLabel(row.compiledRule), {
      id: "surface",
      header: "Surface",
      enableSorting: false
    }),
    draftHelper.accessor("status", {
      header: "Status",
      enableSorting: false,
      cell: ({ getValue }) => {
        const value = getValue();
        const variant = value === "ready_for_activation" ? "ready" : undefined;
        return <StatusBadge status={value} variant={variant} />;
      }
    }),
    draftHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="c-TacticsTable__actions">
          <ActionButton icon="inspect" tooltip="View draft details" onClick={() => onInspect(row.original)} />
          {row.original.status === "ready_for_activation" ? (
            <ActionButton icon="activate" tooltip="Activate draft" onClick={() => onPublish(row.original.id)} />
          ) : null}
        </div>
      )
    })
  ];
}
