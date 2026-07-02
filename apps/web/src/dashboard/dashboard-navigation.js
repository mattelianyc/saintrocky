import { saintRockyBranding } from "@saintrocky/branding";

export const HIDDEN_DASHBOARD_SECTION_SLUGS = new Set(["friends", "messages", "campaigns"]);

export function isHiddenDashboardSectionSlug(slug = "") {
  return HIDDEN_DASHBOARD_SECTION_SLUGS.has(slug);
}

export function getVisibleDashboardSections() {
  return saintRockyBranding.dashboardSections.filter(
    (section) => !isHiddenDashboardSectionSlug(section.slug)
  );
}
