"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export function useEscrowVault({ idl } = {}) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [vault, setVault] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVault = useCallback(async () => {
    if (!connected || !publicKey || !idl) return;
    setIsLoading(true);
    setError(null);

    try {
      const { createEscrowClient } = await import("@saintrocky/escrow");
      const anchor = await import("@coral-xyz/anchor");
      const { AnchorProvider } = anchor.default || anchor;

      const provider = new AnchorProvider(connection, window.solana, {
        commitment: "confirmed"
      });
      const client = createEscrowClient({ connection, wallet: provider.wallet, idl });
      const vaultData = await client.getUserVault(publicKey.toBase58());
      setVault(vaultData);
    } catch (fetchError) {
      setError(fetchError.message);
      setVault(null);
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, connection, idl]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  const deposit = useCallback(
    async (amountLamports) => {
      if (!connected || !publicKey || !idl) return null;
      setError(null);

      try {
        const { createEscrowClient } = await import("@saintrocky/escrow");
        const anchor = await import("@coral-xyz/anchor");
        const { AnchorProvider } = anchor.default || anchor;

        const provider = new AnchorProvider(connection, window.solana, {
          commitment: "confirmed"
        });
        const client = createEscrowClient({ connection, wallet: provider.wallet, idl });
        const result = await client.deposit(amountLamports);
        await fetchVault();
        return result;
      } catch (depositError) {
        setError(depositError.message);
        return null;
      }
    },
    [connected, publicKey, connection, idl, fetchVault]
  );

  const withdraw = useCallback(
    async (amountLamports) => {
      if (!connected || !publicKey || !idl) return null;
      setError(null);

      try {
        const { createEscrowClient } = await import("@saintrocky/escrow");
        const anchor = await import("@coral-xyz/anchor");
        const { AnchorProvider } = anchor.default || anchor;

        const provider = new AnchorProvider(connection, window.solana, {
          commitment: "confirmed"
        });
        const client = createEscrowClient({ connection, wallet: provider.wallet, idl });
        const result = await client.withdraw(amountLamports);
        await fetchVault();
        return result;
      } catch (withdrawError) {
        setError(withdrawError.message);
        return null;
      }
    },
    [connected, publicKey, connection, idl, fetchVault]
  );

  const createVault = useCallback(async () => {
    if (!connected || !publicKey || !idl) return null;
    setError(null);

    try {
      const { createEscrowClient } = await import("@saintrocky/escrow");
      const anchor = await import("@coral-xyz/anchor");
      const { AnchorProvider } = anchor.default || anchor;

      const provider = new AnchorProvider(connection, window.solana, {
        commitment: "confirmed"
      });
      const client = createEscrowClient({ connection, wallet: provider.wallet, idl });
      const result = await client.createUserVault();
      await fetchVault();
      return result;
    } catch (createError) {
      setError(createError.message);
      return null;
    }
  }, [connected, publicKey, connection, idl, fetchVault]);

  const balanceSol = vault ? vault.balanceLamports / 1_000_000_000 : 0;

  return {
    vault,
    balanceSol,
    isLoading,
    error,
    deposit,
    withdraw,
    createVault,
    refreshVault: fetchVault
  };
}
