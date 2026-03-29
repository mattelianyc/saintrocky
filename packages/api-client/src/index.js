import { createHttpClient, setUnauthorizedHandler } from "./core/http.js";
import { normalizeHttpError } from "./core/errors.js";
import { resolveApiBaseUrl } from "./core/url.js";
import { createActivityClient } from "./modules/activity.js";
import { createAlertsClient } from "./modules/alerts.js";
import { createAuthClient } from "./modules/auth.js";
import { createBillingClient } from "./modules/billing.js";
import { createDashboardClient } from "./modules/dashboard.js";
import { createDesktopSessionsClient } from "./modules/desktop-sessions.js";
import { createDevicesClient } from "./modules/devices.js";
import { createExtensionSessionsClient } from "./modules/extension-sessions.js";
import { createPoliciesClient } from "./modules/policies.js";
import { createRulesClient } from "./modules/rules.js";
import { createUsersClient } from "./modules/users.js";
import { createWalletsClient } from "./modules/wallets.js";
import { createChainClient } from "./modules/chain.js";
import { createLeaderboardClient } from "./modules/leaderboard.js";
import { createWorkflowsClient } from "./modules/workflows.js";

export { setUnauthorizedHandler, normalizeHttpError, resolveApiBaseUrl };

export function createApiClient(options = {}) {
  const httpClient = createHttpClient(options);

  return {
    auth: createAuthClient(httpClient),
    alerts: createAlertsClient(httpClient),
    workflows: createWorkflowsClient(httpClient),
    policies: createPoliciesClient(httpClient),
    rules: createRulesClient(httpClient),
    billing: createBillingClient(httpClient),
    dashboard: createDashboardClient(httpClient),
    devices: createDevicesClient(httpClient),
    activity: createActivityClient(httpClient),
    desktopSessions: createDesktopSessionsClient(httpClient),
    extensionSessions: createExtensionSessionsClient(httpClient),
    users: createUsersClient(httpClient),
    wallets: createWalletsClient(httpClient),
    chain: createChainClient(httpClient),
    leaderboard: createLeaderboardClient(httpClient)
  };
}

export const api = createApiClient();


