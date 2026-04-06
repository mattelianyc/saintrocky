"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  PendingActionsWidget,
  usePendingActionsWidgetMode
} from "@saintrocky/ui/web";
import { useDashboardRules } from "@/src/dashboard/DashboardRulesContext.jsx";

const STORAGE_KEY = "web-dashboard-live-activity-view-mode";

export function useDashboardPendingActionsWidgetState() {
  const pathname = usePathname();
  const { pendingActions, submittingActionId, handleConfirmAction, handleCancelAction } = useDashboardRules();
  const isOverviewRoute = pathname === "/dashboard";
  const {
    availableViewModes,
    isNarrowViewport,
    responsiveViewMode,
    setViewMode,
    viewMode
  } = usePendingActionsWidgetMode({
    defaultViewMode: isOverviewRoute ? "full" : "closed",
    preferredViewMode: isOverviewRoute ? "full" : "closed",
    storageKey: STORAGE_KEY
  });

  const widgetProps = useMemo(
    () => ({
      availableViewModes,
      expandViewMode: isOverviewRoute ? "full" : "floating",
      isNarrowViewport,
      onCancelAction: handleCancelAction,
      onConfirmAction: handleConfirmAction,
      onViewModeChange: setViewMode,
      pendingActions,
      responsiveViewMode,
      submittingActionId,
      viewMode
    }),
    [
      availableViewModes,
      handleCancelAction,
      handleConfirmAction,
      isNarrowViewport,
      isOverviewRoute,
      pendingActions,
      responsiveViewMode,
      setViewMode,
      submittingActionId,
      viewMode
    ]
  );

  return {
    responsiveViewMode,
    widgetProps
  };
}

export function PendingActionsWidgetShell() {
  const { widgetProps } = useDashboardPendingActionsWidgetState();

  return <PendingActionsWidget {...widgetProps} />;
}
