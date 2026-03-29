import { PageLayout } from "@saintrocky/ui";

import { DashboardSidebarShell } from "@/src/dashboard/DashboardSidebarShell.jsx";
import { DashboardWalletProvider } from "@/src/dashboard/DashboardWalletProvider.jsx";

export default function DashboardLayout({ children }) {
  const solanaEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899";

  return (
    <DashboardWalletProvider endpoint={solanaEndpoint}>
      <PageLayout
        className="sr-WebDashboardLayout"
        sidebar={<DashboardSidebarShell />}
      >
        {children}
      </PageLayout>
    </DashboardWalletProvider>
  );
}
