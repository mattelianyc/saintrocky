import { Router } from "express";

import { createActivityRouter } from "./activity.route.js";
import { createAlertsRouter } from "./alerts.route.js";
import { createAuthRouter } from "./auth.route.js";
import { createBillingRouter } from "./billing.route.js";
import { createDashboardRouter } from "./dashboard.route.js";
import { createDesktopSessionsRouter } from "./desktop-sessions.route.js";
import { createDevicesRouter } from "./devices.route.js";
import { createExtensionSessionsRouter } from "./extension-sessions.route.js";
import { createPoliciesRouter } from "./policies.route.js";
import { createRulesRouter } from "./rules.route.js";
import { createUsersRouter } from "./users.route.js";
import { createWalletsRouter } from "./wallets.route.js";
import { createChainRouter } from "./chain.route.js";
import { createLeaderboardRouter } from "./leaderboard.route.js";
import { createWorkflowsRouter } from "./workflows.route.js";

export function createV1Router() {
  const router = Router();

  router.use("/auth", createAuthRouter());
  router.use("/users", createUsersRouter());
  router.use("/billing", createBillingRouter());
  router.use("/alerts", createAlertsRouter());
  router.use("/workflows", createWorkflowsRouter());
  router.use("/policies", createPoliciesRouter());
  router.use("/rules", createRulesRouter());
  router.use("/devices", createDevicesRouter());
  router.use("/activity", createActivityRouter());
  router.use("/desktop-sessions", createDesktopSessionsRouter());
  router.use("/extension-sessions", createExtensionSessionsRouter());
  router.use("/dashboard", createDashboardRouter());
  router.use("/wallets", createWalletsRouter());
  router.use("/chain", createChainRouter());
  router.use("/leaderboard", createLeaderboardRouter());

  return router;
}
