import { PageLayout } from "@saintrocky/ui";
import { loadWebRuntimeConfig } from "@saintrocky/config";

import { DashboardAccessGate } from "@/src/auth/DashboardAccessGate.jsx";
import { DashboardSidebarShell } from "@/src/dashboard/DashboardSidebarShell.jsx";
import { DashboardWalletProvider } from "@/src/dashboard/DashboardWalletProvider.jsx";

const runtimeConfig = loadWebRuntimeConfig(process.env);

export default function DashboardLayout({ children }) {
  const solanaEndpoint = runtimeConfig.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899";

  return (
    <DashboardWalletProvider endpoint={solanaEndpoint}>
      <DashboardAccessGate>
        <PageLayout
          className="sr-WebDashboardLayout"
          sidebar={<DashboardSidebarShell />}
        >
          {children}
        </PageLayout>
      </DashboardAccessGate>
    </DashboardWalletProvider>
  );
}
