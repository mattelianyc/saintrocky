import { alertFeed } from "@saintrocky/alerts";
import { saintRockyBranding } from "@saintrocky/branding";
import { networkPolicies } from "@saintrocky/network-policies";
import { workflowTemplates } from "@saintrocky/workflows";

export const desktopRuntimeModels = {
  branding: saintRockyBranding,
  alerts: alertFeed,
  workflows: workflowTemplates,
  policies: networkPolicies
};
