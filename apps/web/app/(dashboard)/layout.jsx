import { PageLayout } from "@saintrocky/ui";
import { loadWebRuntimeConfig } from "@saintrocky/config";

import { DashboardAccessGate } from "@/src/auth/DashboardAccessGate.jsx";
import { DashboardRulesProvider } from "@/src/dashboard/DashboardRulesContext.jsx";
import { PendingActionsWidgetShell } from "@/src/dashboard/PendingActionsWidgetShell.jsx";
import { DashboardSidebarShell } from "@/src/dashboard/DashboardSidebarShell.jsx";
import { DashboardWalletProvider } from "@/src/dashboard/DashboardWalletProvider.jsx";

const runtimeConfig = loadWebRuntimeConfig(process.env);

export default function DashboardLayout({ children }) {
  const solanaEndpoint = runtimeConfig.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899";

  return (
    <DashboardWalletProvider endpoint={solanaEndpoint}>
      <DashboardAccessGate>
        <DashboardRulesProvider>
          <PageLayout
            className="sr-WebDashboardLayout"
            sidebar={<DashboardSidebarShell />}
          >
            <>
              {children}
              <PendingActionsWidgetShell />
            </>
          </PageLayout>
        </DashboardRulesProvider>
      </DashboardAccessGate>
    </DashboardWalletProvider>
  );
}
