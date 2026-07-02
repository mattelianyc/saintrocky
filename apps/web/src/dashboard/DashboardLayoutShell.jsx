"use client";

import { useEffect, useState } from "react";

import { useIsMobileViewport } from "@saintrocky/shared";
import { Drawer, PageLayout } from "@saintrocky/ui";
import { PendingActionsWidget } from "@saintrocky/ui/web";

import { MobileNavHeader } from "@/src/dashboard/MobileNavHeader.jsx";
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
  const isMobileViewport = useIsMobileViewport(900);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { responsiveViewMode, widgetProps } = useDashboardPendingActionsWidgetState();
  const isDockedMode = responsiveViewMode === "rail" || responsiveViewMode === "full";
  const isMobileNavigation = isMobileViewport === true;
  const shouldDockTrailingPanel = isDockedMode && !isMobileNavigation;
  const mainClassName =
    responsiveViewMode === "full" && !isMobileNavigation ? "c-PageLayout__main--hidden" : "";

  useEffect(() => {
    if (!isMobileNavigation) {
      setIsDrawerOpen(false);
    }
  }, [isMobileNavigation]);

  return (
    <>
      {isMobileNavigation ? (
        <>
          <MobileNavHeader
            isMenuOpen={isDrawerOpen}
            onMenuToggle={() => setIsDrawerOpen((previousState) => !previousState)}
          />
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            panelClassName="sr-MobileDashboardDrawer"
            panelId="sr-mobile-dashboard-drawer"
            ariaLabel="Dashboard navigation"
          >
            <DashboardSidebarShell onNavigate={() => setIsDrawerOpen(false)} />
          </Drawer>
        </>
      ) : null}
      <PageLayout
        className="sr-WebDashboardLayout"
        sidebar={isMobileNavigation ? null : <DashboardSidebarShell />}
        mainClassName={mainClassName}
        trailingPanel={shouldDockTrailingPanel ? <PendingActionsWidget {...widgetProps} /> : null}
        trailingPanelClassName={getTrailingPanelClassName(responsiveViewMode)}
      >
        <>
          {children}
          {!shouldDockTrailingPanel ? <PendingActionsWidget {...widgetProps} /> : null}
        </>
      </PageLayout>
    </>
  );
}
