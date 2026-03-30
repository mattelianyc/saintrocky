import crypto from 'node:crypto';

import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { ChainTrade } from '@saintrocky/api/models/chain-trade';
import { User } from '@saintrocky/api/models/user';
import { UserRule } from '@saintrocky/api/models/user-rule';
import { WalletLink } from '@saintrocky/api/models/wallet-link';
import { MEMBER_ROLE } from '@saintrocky/shared';
import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

const LAMPORTS_PER_SOL = 1_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const tradingPlatforms = [
  {
    label: 'Pump.fun',
    programId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
    tokenSymbols: ['WEN', 'BONK', 'POPCAT', 'MEW', 'BOME']
  },
  {
    label: 'Phantom Swap',
    programId: 'PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP',
    tokenSymbols: ['PYTH', 'JTO', 'WIF', 'RENDER', 'JUP']
  },
  {
    label: 'Jupiter',
    programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
    tokenSymbols: ['JUP', 'SOL', 'USDC', 'BONK', 'WIF']
  },
  {
    label: 'Raydium',
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    tokenSymbols: ['RAY', 'SOL', 'USDT', 'JTO', 'PYTH']
  }
];

const walletLabels = ['Primary', 'Execution', 'Degen', 'Research'];
const disciplineProfiles = [
  { minTrades: 52, maxTrades: 66, violationRate: 0.05, extraEscrowSolMin: 5.5, extraEscrowSolMax: 9.5 },
  { minTrades: 60, maxTrades: 78, violationRate: 0.08, extraEscrowSolMin: 3.5, extraEscrowSolMax: 7.5 },
  { minTrades: 72, maxTrades: 96, violationRate: 0.15, extraEscrowSolMin: 2.0, extraEscrowSolMax: 5.0 },
  { minTrades: 44, maxTrades: 58, violationRate: 0.03, extraEscrowSolMin: 7.0, extraEscrowSolMax: 12.0 }
];

function createDeterministicRandom(seed) {
  let state = crypto.createHash('sha256').update(String(seed)).digest().readUInt32BE(0);
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

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

function randomInt(nextRandom, min, max) {
  return Math.floor(nextRandom() * (max - min + 1)) + min;
}

function randomFloat(nextRandom, min, max, precision = 3) {
  const value = min + nextRandom() * (max - min);
  return Math.round(value * 10 ** precision) / 10 ** precision;
}

function pick(nextRandom, values) {
  return values[randomInt(nextRandom, 0, values.length - 1)];
}

function buildReason(rule, solAmount, tradeTimestamp) {
  switch (rule?.templateKey) {
    case 'max-position-size':
      return `Position size ${solAmount.toFixed(3)} SOL exceeded your configured ceiling.`;
    case 'no-trading-during-hours':
      return `Trade executed during a blocked session at ${tradeTimestamp.getHours().toString().padStart(2, '0')}:${tradeTimestamp
        .getMinutes()
        .toString()
        .padStart(2, '0')}.`;
    case 'cooldown-after-loss':
      return 'Trade fired before your post-loss cooldown expired.';
    case 'max-daily-loss':
      return 'This trade pushed your realized daily loss above the configured threshold.';
    case 'no-fomo-buys':
      return 'Impulse buy detected before the token aged out of your fomo lock.';
    default:
      return 'Trade cadence exceeded the active rule configuration for this wallet.';
  }
}

function chooseViolatingRule(activeRules, tradeTimestamp, solAmount) {
  if (!activeRules.length) return null;

  const hour = tradeTimestamp.getHours();
  const scheduleRule = activeRules.find((rule) => rule.templateKey === 'no-trading-during-hours');
  if (scheduleRule && (hour <= 6 || hour >= 22)) return scheduleRule;

  const positionRule = activeRules.find((rule) => rule.templateKey === 'max-position-size');
  if (positionRule && solAmount >= 2.2) return positionRule;

  const lossRule = activeRules.find((rule) => rule.templateKey === 'max-daily-loss');
  if (lossRule && solAmount >= 1.4) return lossRule;

  return activeRules[0];
}

function splitLamportsAcrossWallets(totalLamports, walletCount, nextRandom) {
  if (walletCount === 1) return [totalLamports];

  const remaining = totalLamports;
  const allocations = [];
  let runningTotal = 0;

  for (let index = 0; index < walletCount; index += 1) {
    if (index === walletCount - 1) {
      allocations.push(remaining - runningTotal);
      continue;
    }

    const share = 0.25 + nextRandom() * 0.35;
    const allocation = Math.max(
      Math.round(totalLamports * share),
      Math.round(0.75 * LAMPORTS_PER_SOL)
    );
    allocations.push(allocation);
    runningTotal += allocation;
  }

  return allocations;
}

export async function seedWallets() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  await connectMongo(mongoUri);

  await WalletLink.deleteMany({});
  await ChainTrade.deleteMany({});

  const members = await User.find({ role: MEMBER_ROLE }).sort({ email: 1 }).lean();
  if (!members.length) throw new Error('Seed users before seeding wallets.');
  const rules = await UserRule.find({ status: 'active' }).lean();
  const rulesByEmail = new Map();
  for (const rule of rules) {
    const existingRules = rulesByEmail.get(rule.ownerEmail) || [];
    existingRules.push(rule);
    rulesByEmail.set(rule.ownerEmail, existingRules);
  }

  const walletLinks = [];
  const chainTrades = [];

  members.forEach((member, memberIndex) => {
    const nextRandom = createDeterministicRandom(member.email);
    const profile = disciplineProfiles[memberIndex % disciplineProfiles.length];
    const activeRules = rulesByEmail.get(member.email) || [];
    const walletCount = memberIndex % 5 === 0 ? 2 : 1;
    const tradeCount = randomInt(nextRandom, profile.minTrades, profile.maxTrades);
    const totalLockedStakeLamports = activeRules.reduce(
      (sum, rule) => sum + (rule.lockedStakeLamports || 0),
      0
    );
    const totalEscrowLamports =
      totalLockedStakeLamports +
      Math.round(
        randomFloat(
          nextRandom,
          profile.extraEscrowSolMin,
          profile.extraEscrowSolMax,
          3
        ) * LAMPORTS_PER_SOL
      );

    const walletBalanceAllocations = splitLamportsAcrossWallets(
      totalEscrowLamports,
      walletCount,
      nextRandom
    );
    const walletsForMember = [];

    for (let walletIndex = 0; walletIndex < walletCount; walletIndex += 1) {
      const walletAddress = generateFakeWalletAddress(memberIndex * 10 + walletIndex);
      const linkedAt = new Date(Date.now() - randomInt(nextRandom, 10, 55) * DAY_MS).toISOString();
      const walletLink = {
        userId: String(member._id),
        userEmail: member.email,
        walletAddress,
        chain: 'solana',
        label: walletLabels[(memberIndex + walletIndex) % walletLabels.length],
        isPrimary: walletIndex === 0,
        escrowVaultAddress: generateFakeWalletAddress(memberIndex * 10 + walletIndex + 10000),
        escrowBalanceLamports: walletBalanceAllocations[walletIndex],
        heliusWebhookId: null,
        linkedAt,
        lastActivityAt: linkedAt
      };

      walletLinks.push(walletLink);
      walletsForMember.push(walletLink);
    }

    let latestActivityAt = null;

    for (let tradeIndex = 0; tradeIndex < tradeCount; tradeIndex += 1) {
      const wallet = walletsForMember[randomInt(nextRandom, 0, walletsForMember.length - 1)];
      const tradingPlatform = pick(nextRandom, tradingPlatforms);
      const tokenSymbol = pick(nextRandom, tradingPlatform.tokenSymbols);
      const direction = pick(nextRandom, ['buy', 'sell', 'swap', 'buy', 'buy']);
      const daysAgo = randomInt(nextRandom, 0, 44);
      const hoursAgo = randomInt(nextRandom, 0, 23);
      const minutesAgo = randomInt(nextRandom, 0, 59);
      const timestamp = new Date(Date.now() - daysAgo * DAY_MS - hoursAgo * HOUR_MS - minutesAgo * 60_000);
      const notionalBias = tradeIndex % 11 === 0 ? 1.8 : 1;
      const solAmount = randomFloat(nextRandom, 0.08, 2.4 * notionalBias, 3);
      const violatingRule = chooseViolatingRule(activeRules, timestamp, solAmount);
      const shouldViolate =
        Boolean(violatingRule) &&
        (nextRandom() < profile.violationRate || tradeIndex % 19 === 0);
      const violationId = shouldViolate ? `violation-${memberIndex}-${tradeIndex}` : null;

      chainTrades.push({
        signature: generateFakeSignature(memberIndex, tradeIndex),
        walletAddress: wallet.walletAddress,
        userId: String(member._id),
        userEmail: member.email,
        programId: tradingPlatform.programId,
        direction,
        tokenMint: generateFakeWalletAddress(memberIndex * 1000 + tradeIndex + 50000),
        solAmount,
        timestamp,
        isViolation: shouldViolate,
        violationIds: violationId ? [violationId] : [],
        violationDetails: violationId
          ? [{
              violationId,
              ruleId: violatingRule.ruleId,
              ruleSummary: violatingRule.summary || violatingRule.title,
              reason: buildReason(violatingRule, solAmount, timestamp),
              tradeSignature: generateFakeSignature(memberIndex, tradeIndex),
              detectedAt: timestamp.toISOString()
            }]
          : [],
        fee: randomFloat(nextRandom, 0.000003, 0.000012, 6),
        raw: {
          source: 'SEED',
          type: direction === 'swap' ? 'SWAP' : 'TRADE',
          tokenSymbol,
          platformLabel: tradingPlatform.label
        }
      });

      if (!latestActivityAt || timestamp > latestActivityAt) {
        latestActivityAt = timestamp;
      }
    }

    if (latestActivityAt) {
      walletsForMember.forEach((wallet) => {
        wallet.lastActivityAt = latestActivityAt.toISOString();
      });
    }
  });

  await WalletLink.insertMany(walletLinks);
  await ChainTrade.insertMany(chainTrades);

  await disconnectMongo();
  console.log(`[seed] wallets seeded: wallets=${walletLinks.length}, trades=${chainTrades.length}`);
}

runSeedScript(import.meta.url, seedWallets);
