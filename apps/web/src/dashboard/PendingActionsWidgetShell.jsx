"use client";

import { PendingActionsWidget } from "@saintrocky/ui/web";
import { useDashboardRules } from "@/src/dashboard/DashboardRulesContext.jsx";

export function PendingActionsWidgetShell() {
  const { pendingActions, submittingActionId, handleConfirmAction, handleCancelAction } = useDashboardRules();

  return (
    <PendingActionsWidget
      pendingActions={pendingActions}
      submittingActionId={submittingActionId}
      onConfirmAction={handleConfirmAction}
      onCancelAction={handleCancelAction}
    />
  );
}
