"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { getSolanaEndpoint } from "./networks.js";

import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaWalletProvider({ endpoint, children }) {
  const resolvedEndpoint = useMemo(() => getSolanaEndpoint(endpoint), [endpoint]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={resolvedEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
