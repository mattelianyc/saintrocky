import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { env } from "@saintrocky/api/config/env";
import { logger } from "@saintrocky/api/logger";

import { startCron } from "./cron/index.js";
import { setEscrowClient } from "./services/escrow.service.js";
import { attachRealtimeServer } from "./services/realtime.service.js";

let hasStartedAncillaryServices = false;
let escrowBootstrapPromise = null;

function resolveKeypairBytes() {
  if (env.solanaPlatformKeypair) {
    return JSON.parse(env.solanaPlatformKeypair);
  }

  const localKeypairPath = path.join(process.env.HOME || "", ".config/solana/id.json");
  if (existsSync(localKeypairPath)) {
    return JSON.parse(readFileSync(localKeypairPath, "utf-8"));
  }

  throw new Error(
    "No Solana platform keypair available. Set SOLANA_PLATFORM_KEYPAIR env var " +
    "(JSON array of secret key bytes) or place a keypair at ~/.config/solana/id.json."
  );
}

export function startApiAncillaryServices() {
  if (hasStartedAncillaryServices) {
    return;
  }

  hasStartedAncillaryServices = true;
  startCron();
  bootstrapEscrowClient().catch((error) => {
    logger.warn(`[escrow] Skipping on-chain client: ${error.message}`);
  });
}

export async function bootstrapEscrowClient() {
  if (escrowBootstrapPromise) {
    return escrowBootstrapPromise;
  }

  escrowBootstrapPromise = (async () => {
    if (!env.solanaRpcUrl || env.solanaRpcUrl === "https://api.mainnet-beta.solana.com") {
      logger.info("[escrow] No dedicated Solana RPC configured, skipping on-chain client.");
      return null;
    }

    const { Connection, Keypair } = await import("@solana/web3.js");
    const anchor = await import("@coral-xyz/anchor");
    const { Wallet } = anchor.default || anchor;
    const { createEscrowClient, ESCROW_IDL } = await import("@saintrocky/escrow");

    const connection = new Connection(env.solanaRpcUrl, "confirmed");
    const keypairData = resolveKeypairBytes();
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    const wallet = new Wallet(keypair);

    const escrowClient = createEscrowClient({ connection, wallet, idl: ESCROW_IDL });
    setEscrowClient(escrowClient);
    logger.info("[escrow] On-chain client initialized.");
    return escrowClient;
  })();

  try {
    return await escrowBootstrapPromise;
  } catch (error) {
    escrowBootstrapPromise = null;
    throw error;
  }
}

export { attachRealtimeServer };
