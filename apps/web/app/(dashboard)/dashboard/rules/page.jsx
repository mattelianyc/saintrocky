import { saintRockyBranding } from "@saintrocky/branding";
import { RulesWorkspace } from "@saintrocky/ui/web";

export default function RulesPage() {
  const section = saintRockyBranding.dashboardSections.find((entry) => entry.slug === "rules");

  return <RulesWorkspace section={section} />;
}
