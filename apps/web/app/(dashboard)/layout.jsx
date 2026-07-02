import { loadWebRuntimeConfig } from "@saintrocky/config";

import { DashboardAccessGate } from "@/src/auth/DashboardAccessGate.jsx";
import { DashboardLayoutShell } from "@/src/dashboard/DashboardLayoutShell.jsx";
import { DashboardRulesProvider } from "@/src/dashboard/DashboardRulesContext.jsx";
import { DashboardWalletProvider } from "@/src/dashboard/DashboardWalletProvider.jsx";

const runtimeConfig = loadWebRuntimeConfig(process.env);

export default function DashboardLayout({ children }) {
  const solanaEndpoint = runtimeConfig.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899";

  return (
    <DashboardWalletProvider endpoint={solanaEndpoint}>
      <DashboardAccessGate>
        <DashboardRulesProvider>
          <DashboardLayoutShell>{children}</DashboardLayoutShell>
        </DashboardRulesProvider>
      </DashboardAccessGate>
    </DashboardWalletProvider>
  );
}
