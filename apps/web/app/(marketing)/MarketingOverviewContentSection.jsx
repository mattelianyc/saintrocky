"use client";

import { MarketingOverviewSection } from "@saintrocky/ui/web";
import { saintRockyBranding } from "@saintrocky/branding";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

export default function MarketingOverviewContentSection() {
  const { isAuthenticated, isLoadingSession } = useAuthSession();

  const actionLabel = isLoadingSession
    ? "Checking session..."
    : isAuthenticated
      ? "Open control plane"
      : "Join the network";

  const actionHref = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <MarketingOverviewSection
      marketingOverview={saintRockyBranding.marketingOverview}
      actionHref={actionHref}
      actionLabel={actionLabel}
      isActionPending={isLoadingSession}
    />
  );
}
