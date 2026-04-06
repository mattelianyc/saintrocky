"use client";

import { PageLayout } from "@saintrocky/ui";
import { PendingActionsWidget } from "@saintrocky/ui/web";

import { DashboardSidebarShell } from "@/src/dashboard/DashboardSidebarShell.jsx";
import { useDashboardPendingActionsWidgetState } from "@/src/dashboard/PendingActionsWidgetShell.jsx";

function getTrailingPanelClassName(responsiveViewMode) {
  if (responsiveViewMode === "rail") {
    return "c-PageLayout__trailingPanel--liveActivityRail";
  }

  if (responsiveViewMode === "full") {
    return "c-PageLayout__trailingPanel--liveActivityFull";
  }

  return "";
}

export function DashboardLayoutShell({ children }) {
  const { responsiveViewMode, widgetProps } = useDashboardPendingActionsWidgetState();
  const isDockedMode = responsiveViewMode === "rail" || responsiveViewMode === "full";

  return (
    <PageLayout
      className="sr-WebDashboardLayout"
      sidebar={<DashboardSidebarShell />}
      mainClassName={responsiveViewMode === "full" ? "c-PageLayout__main--hidden" : ""}
      trailingPanel={isDockedMode ? <PendingActionsWidget {...widgetProps} /> : null}
      trailingPanelClassName={getTrailingPanelClassName(responsiveViewMode)}
    >
      <>
        {children}
        {!isDockedMode ? <PendingActionsWidget {...widgetProps} /> : null}
      </>
    </PageLayout>
  );
}
