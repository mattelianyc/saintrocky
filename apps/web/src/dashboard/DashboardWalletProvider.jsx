"use client";

import { SolanaWalletProvider } from "@saintrocky/wallet";

export function DashboardWalletProvider({ endpoint, children }) {
  return (
    <SolanaWalletProvider endpoint={endpoint}>
      {children}
    </SolanaWalletProvider>
  );
}
