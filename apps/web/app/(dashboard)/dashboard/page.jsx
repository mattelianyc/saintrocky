import { saintRockyBranding } from "@saintrocky/branding";
import { DashboardOverview } from "@saintrocky/ui";

async function getDashboardSummary() {
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${apiBaseUrl}/api/v1/dashboard`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return {
      counts: {
        disciplineScore: "—",
        escrowBalanceSol: "—",
        activeRules: 0,
        recentViolations: 0
      }
    };
  }

  return response.json();
}

export default async function DashboardPage() {
  const dashboard = await getDashboardSummary();

  return (
    <DashboardOverview
      eyebrow={saintRockyBranding.companyName}
      title={saintRockyBranding.productName}
      summary="On-chain escrow enforcement, real-time trade monitoring, and discipline rankings for Solana traders."
      counts={dashboard.counts}
      sections={saintRockyBranding.dashboardSections}
    />
  );
}
