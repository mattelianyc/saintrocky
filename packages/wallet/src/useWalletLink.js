"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@saintrocky/api-client";

export function useWalletLink() {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const [linkedWallets, setLinkedWallets] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const walletAddress = publicKey?.toBase58() || null;
  const isLinked = linkedWallets.some((wallet) => wallet.walletAddress === walletAddress);

  const fetchLinkedWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.wallets.listWallets();
      setLinkedWallets(result.wallets || []);
    } catch {
      setLinkedWallets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedWallets();
  }, [fetchLinkedWallets]);

  const linkCurrentWallet = useCallback(
    async (label = "Primary") => {
      if (!publicKey || !signMessage) return;
      setIsLinking(true);
      setError(null);

      try {
        const message = new TextEncoder().encode(
          `Link wallet ${publicKey.toBase58()} to SaintRocky account`
        );
        const signature = await signMessage(message);
        const signatureBase64 = Buffer.from(signature).toString("base64");

        await api.wallets.linkWallet({
          walletAddress: publicKey.toBase58(),
          signature: signatureBase64,
          label
        });

        await fetchLinkedWallets();
      } catch (linkError) {
        setError(linkError.message || "Failed to link wallet.");
      } finally {
        setIsLinking(false);
      }
    },
    [publicKey, signMessage, fetchLinkedWallets]
  );

  const unlinkWallet = useCallback(
    async (address) => {
      setError(null);
      try {
        await api.wallets.unlinkWallet(address);
        await fetchLinkedWallets();
      } catch (unlinkError) {
        setError(unlinkError.message || "Failed to unlink wallet.");
      }
    },
    [fetchLinkedWallets]
  );

  return {
    walletAddress,
    connected,
    isLinked,
    isLinking,
    isLoading,
    linkedWallets,
    error,
    linkCurrentWallet,
    unlinkWallet,
    disconnect,
    refreshWallets: fetchLinkedWallets
  };
}
