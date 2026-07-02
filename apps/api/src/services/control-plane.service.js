import { alertFeed } from "@saintrocky/alerts";
import { buildSessionUser } from "@saintrocky/auth";
import { billingPlans, billingSummary } from "@saintrocky/billing";
import { saintRockyBranding } from "@saintrocky/branding";
import { networkPolicies } from "@saintrocky/network-policies";
import { usersDirectory } from "@saintrocky/users";
import { workflowTemplates } from "@saintrocky/workflows";

const devices = [
  {
    id: "device-001",
    name: "$TANDARD / DEVIANT$ Desktop",
    surface: "desktop",
    status: "protected"
  },
  {
    id: "device-002",
    name: "$TANDARD / DEVIANT$ Browser Extension",
    surface: "extension",
    status: "active"
  },
  {
    id: "device-003",
    name: "$TANDARD / DEVIANT$ Mobile",
    surface: "mobile",
    status: "lightweight"
  }
];

const activityFeed = [
  {
    id: "activity-001",
    title: "Focus workflow entered enforcement mode",
    surface: "desktop",
    timestamp: "2026-03-28T11:10:00.000Z"
  },
  {
    id: "activity-002",
    title: "Blocked browser detour captured",
    surface: "extension",
    timestamp: "2026-03-28T11:22:00.000Z"
  },
  {
    id: "activity-003",
    title: "Mobile legitimacy sync completed",
    surface: "mobile",
    timestamp: "2026-03-28T11:30:00.000Z"
  }
];

const desktopSessions = [
  {
    id: "desktop-session-001",
    machineName: "MacBook Pro",
    enforcementMode: "strict",
    status: "connected"
  }
];

const extensionSessions = [
  {
    id: "extension-session-001",
    browserName: "Arc",
    workflowId: "workflow-deep-work",
    status: "active"
  }
];

export function getAuthState() {
  return {
    ok: true,
    user: buildSessionUser()
  };
}

export function loginAsOperator(email) {
  return {
    ok: true,
    user: buildSessionUser(email)
  };
}

export function listUsers() {
  return {
    ok: true,
    users: usersDirectory
  };
}

export function listAlerts() {
  return {
    ok: true,
    alerts: alertFeed
  };
}

export function listWorkflows() {
  return {
    ok: true,
    workflows: workflowTemplates
  };
}

export function listPolicies() {
  return {
    ok: true,
    policies: networkPolicies
  };
}

export function getBilling() {
  return {
    ok: true,
    summary: billingSummary,
    plans: billingPlans
  };
}

export function listDevices() {
  return {
    ok: true,
    devices
  };
}

export function listActivity() {
  return {
    ok: true,
    activity: activityFeed
  };
}

export function listDesktopSessions() {
  return {
    ok: true,
    sessions: desktopSessions
  };
}

export function listExtensionSessions() {
  return {
    ok: true,
    sessions: extensionSessions
  };
}

export function getDashboardSummary() {
  return {
    ok: true,
    product: {
      companyName: saintRockyBranding.companyName,
      productName: saintRockyBranding.productName,
      shortProductName: saintRockyBranding.shortProductName
    },
    counts: {
      alerts: alertFeed.length,
      workflows: workflowTemplates.length,
      policies: networkPolicies.length,
      devices: devices.length
    },
    alerts: alertFeed,
    workflows: workflowTemplates,
    policies: networkPolicies,
    devices
  };
}
