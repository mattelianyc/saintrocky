import { saintRockyBranding } from "@saintrocky/branding";
import { networkPolicies } from "@saintrocky/network-policies";
import { foundationalRuleTemplates } from "@saintrocky/shared";
import { workflowTemplates } from "@saintrocky/workflows";

export const extensionRuntimeModels = {
  branding: saintRockyBranding,
  workflows: workflowTemplates,
  policies: networkPolicies,
  ruleTemplates: foundationalRuleTemplates,
  runtimeContract: {
    runtimeSurface: "browser_extension",
    runtimeCapabilities: ["browser_domain_blocking", "browser_navigation_intercept"],
    assignmentsEndpoint: "/api/v1/rules/runtime/assignments?runtimeSurface=browser_extension",
    eventsEndpoint: "/api/v1/rules/runtime/events"
  }
};
