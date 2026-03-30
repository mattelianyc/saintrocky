import { saintRockyBranding } from "@saintrocky/branding";
import { StrategyWorkspace } from "@saintrocky/ui/web";

export default function StrategyPage() {
  const section = saintRockyBranding.dashboardSections.find((entry) => entry.slug === "strategy");

  return <StrategyWorkspace section={section} />;
}
