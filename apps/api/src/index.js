import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { env } from '@saintrocky/api/config/env';
import { logger } from '@saintrocky/api/logger';
import { createApiApp } from '@saintrocky/api/app';
import { attachRealtimeServer } from "./services/realtime.service.js";
import { setEscrowClient } from "./services/escrow.service.js";

const app = createApiApp();
const port = env.port || 4000;
const httpServer = http.createServer(app);

attachRealtimeServer(httpServer);

httpServer.listen(port, () => {
  logger.info(`API listening on :${port}`);
  bootstrapEscrowClient();
});

async function bootstrapEscrowClient() {
  if (!env.solanaRpcUrl || env.solanaRpcUrl === 'https://api.mainnet-beta.solana.com') {
    logger.info('[escrow] No local Solana RPC configured, skipping on-chain client.');
    return;
  }

  try {
    const { Connection, Keypair } = await import('@solana/web3.js');
    const anchor = await import('@coral-xyz/anchor');
    const { Wallet } = anchor.default || anchor;
    const { createEscrowClient } = await import('@saintrocky/escrow');

    const connection = new Connection(env.solanaRpcUrl, 'confirmed');

    const keypairPath = path.join(process.env.HOME, '.config/solana/id.json');
    const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    const wallet = new Wallet(keypair);

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const idlPath = path.resolve(currentDir, '../../../apps/blockchain/target/idl/saintrocky_escrow.json');
    const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));

    const escrowClient = createEscrowClient({ connection, wallet, idl });
    setEscrowClient(escrowClient);
    logger.info('[escrow] On-chain client initialized.');
  } catch (error) {
    logger.warn(`[escrow] Skipping on-chain client: ${error.message}`);
  }
}
