import crypto from 'node:crypto';
import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { User } from '@saintrocky/api/models/user';
import { MEMBER_ROLE } from '@saintrocky/shared';
import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

import mongoose from 'mongoose';

const WalletLinkSchema = new mongoose.Schema({
  userId: String,
  userEmail: String,
  walletAddress: { type: String, unique: true },
  chain: { type: String, default: 'solana' },
  label: { type: String, default: 'Primary' },
  isPrimary: { type: Boolean, default: true },
  escrowVaultAddress: { type: String, default: null },
  escrowBalanceLamports: { type: Number, default: 0 },
  heliusWebhookId: { type: String, default: null },
  linkedAt: String,
  lastActivityAt: { type: String, default: null }
}, { versionKey: false });

const WalletLink = mongoose.models.WalletLink || mongoose.model('WalletLink', WalletLinkSchema);

const ChainTradeSchema = new mongoose.Schema({
  signature: { type: String, unique: true },
  walletAddress: String,
  userId: String,
  userEmail: String,
  programId: String,
  direction: String,
  tokenMint: { type: String, default: null },
  solAmount: Number,
  timestamp: Date,
  isViolation: { type: Boolean, default: false },
  violationIds: [String],
  violationDetails: [mongoose.Schema.Types.Mixed],
  fee: { type: Number, default: 0 },
  raw: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { versionKey: false });

const ChainTrade = mongoose.models.ChainTrade || mongoose.model('ChainTrade', ChainTradeSchema);

function generateFakeBase58(length, seed) {
  const bytes = crypto.createHash('sha512').update(String(seed)).digest();
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += base58Chars[bytes[i % bytes.length] % base58Chars.length];
  }
  return result;
}

function generateFakeWalletAddress(index) {
  return generateFakeBase58(44, `wallet-${index}`);
}

function generateFakeSignature(memberIndex, tradeIndex) {
  return generateFakeBase58(88, `sig-${memberIndex}-${tradeIndex}`);
}

const PROGRAM_IDS = [
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  'PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
];

const DIRECTIONS = ['buy', 'sell', 'swap', 'buy', 'buy'];

export async function seedWallets() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  await connectMongo(mongoUri);

  await WalletLink.deleteMany({});
  await ChainTrade.deleteMany({});

  const members = await User.find({ role: MEMBER_ROLE }).sort({ email: 1 }).lean();
  if (!members.length) throw new Error('Seed users before seeding wallets.');

  const walletLinks = [];
  const chainTrades = [];

  members.forEach((member, memberIndex) => {
    const walletAddress = generateFakeWalletAddress(memberIndex);
    const escrowBalance = Math.floor((0.5 + Math.random() * 10) * 1_000_000_000);

    walletLinks.push({
      userId: String(member._id),
      userEmail: member.email,
      walletAddress,
      chain: 'solana',
      label: memberIndex % 3 === 0 ? 'Degen wallet' : 'Primary',
      isPrimary: true,
      escrowVaultAddress: generateFakeWalletAddress(memberIndex + 10000),
      escrowBalanceLamports: escrowBalance,
      heliusWebhookId: null,
      linkedAt: new Date(Date.now() - memberIndex * 86_400_000).toISOString(),
      lastActivityAt: new Date(Date.now() - memberIndex * 3_600_000).toISOString()
    });

    const tradeCount = 5 + (memberIndex % 10);
    for (let tradeIndex = 0; tradeIndex < tradeCount; tradeIndex++) {
      const isViolation = tradeIndex % 7 === 0;
      const solAmount = 0.05 + Math.random() * 3;
      const daysAgo = Math.floor(Math.random() * 30);

      chainTrades.push({
        signature: generateFakeSignature(memberIndex, tradeIndex),
        walletAddress,
        userId: String(member._id),
        userEmail: member.email,
        programId: PROGRAM_IDS[tradeIndex % PROGRAM_IDS.length],
        direction: DIRECTIONS[tradeIndex % DIRECTIONS.length],
        tokenMint: generateFakeWalletAddress(memberIndex * 1000 + tradeIndex + 50000),
        solAmount: Math.round(solAmount * 1000) / 1000,
        timestamp: new Date(Date.now() - daysAgo * 86_400_000 - tradeIndex * 3_600_000),
        isViolation,
        violationIds: isViolation ? [`violation-${memberIndex}-${tradeIndex}`] : [],
        violationDetails: isViolation
          ? [{ reason: 'Exceeded daily trade limit', ruleId: `seeded-rule-${memberIndex}` }]
          : [],
        fee: 0.000005,
        raw: { type: 'SWAP', source: 'SEED' }
      });
    }
  });

  await WalletLink.insertMany(walletLinks);
  await ChainTrade.insertMany(chainTrades);

  await disconnectMongo();
  console.log(`[seed] wallets seeded: wallets=${walletLinks.length}, trades=${chainTrades.length}`);
}

runSeedScript(import.meta.url, seedWallets);
