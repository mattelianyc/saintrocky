import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { Connection, Keypair } from '@solana/web3.js';
import * as anchorModule from '@coral-xyz/anchor';
import { createEscrowClient } from '@saintrocky/escrow';

loadDotenv({ path: resolve(process.cwd(), '.env') });

const anchor = anchorModule.default || anchorModule;
const { Wallet } = anchor;

const rpcUrl = process.env.SOLANA_RPC_URL || 'http://localhost:8899';
console.log(`Using Solana RPC: ${rpcUrl}`);
const connection = new Connection(rpcUrl, 'confirmed');
const keypairData = JSON.parse(readFileSync(
  `${process.env.HOME}/.config/solana/id.json`, 'utf-8'
));
const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
const wallet = new Wallet(keypair);

const idl = JSON.parse(readFileSync(
  new URL('../target/idl/saintrocky_escrow.json', import.meta.url), 'utf-8'
));

const client = createEscrowClient({ connection, wallet, idl });

const result = await client.initializePlatform(100);
console.log('Platform initialized:', result);

const config = await client.getPlatformConfig();
console.log('Platform config:', config);
