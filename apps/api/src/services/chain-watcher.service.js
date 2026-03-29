import { randomUUID } from 'node:crypto';

import { parseSolanaTradeEvent, getProgramLabel } from '@saintrocky/chain';
import { isScheduleActive } from '@saintrocky/shared';

import { ChainTrade } from '../models/chain-trade.model.js';
import { WalletLink } from '../models/wallet-link.model.js';
import { UserRule } from '../models/user-rule.model.js';
import { publishSnapshot } from './realtime.service.js';
import { buildRulesChannel } from '@saintrocky/realtime';

export async function handleHeliusWebhook(payload) {
  if (!payload || (!Array.isArray(payload) && typeof payload !== 'object')) return [];

  const transactions = Array.isArray(payload) ? payload : [payload];
  const results = [];

  for (const transaction of transactions) {
    const feePayer = transaction.feePayer || '';
    if (!feePayer) continue;

    const walletLink = await WalletLink.findOne({ walletAddress: feePayer }).lean();
    if (!walletLink) continue;

    const trades = parseSolanaTradeEvent(transaction, feePayer);
    for (const trade of trades) {
      const result = await processChainTrade(trade, walletLink);
      results.push(result);
    }
  }

  return results;
}

async function processChainTrade(trade, walletLink) {
  const existing = await ChainTrade.findOne({ signature: trade.signature }).lean();
  if (existing) return { trade: existing, violations: [] };

  const activeRules = await UserRule.find({
    ownerEmail: walletLink.userEmail,
    status: 'active',
    'compiledRule.chainConstraints': { $ne: null }
  }).lean();

  const violations = [];
  for (const rule of activeRules) {
    const result = evaluateChainConstraint(rule, trade, walletLink);
    if (result.violated) {
      violations.push({
        violationId: randomUUID(),
        ruleId: rule.ruleId,
        ruleSummary: rule.compiledRule?.summary || rule.title,
        reason: result.reason,
        tradeSignature: trade.signature,
        detectedAt: new Date().toISOString()
      });
    }
  }

  const chainTrade = new ChainTrade({
    signature: trade.signature,
    walletAddress: walletLink.walletAddress,
    userId: walletLink.userId,
    userEmail: walletLink.userEmail,
    programId: trade.programId,
    direction: trade.direction,
    tokenMint: trade.tokenMint,
    solAmount: trade.solAmount,
    timestamp: trade.timestamp,
    isViolation: violations.length > 0,
    violationIds: violations.map((violation) => violation.violationId),
    violationDetails: violations,
    fee: trade.fee,
    raw: trade.raw
  });
  await chainTrade.save();

  await WalletLink.updateOne(
    { walletAddress: walletLink.walletAddress },
    { lastActivityAt: new Date().toISOString() }
  );

  if (violations.length > 0) {
    publishSnapshot(buildRulesChannel(walletLink.userEmail), {
      eventType: 'chain_violation_detected',
      violations,
      trade: {
        signature: trade.signature,
        direction: trade.direction,
        tokenMint: trade.tokenMint,
        solAmount: trade.solAmount,
        program: getProgramLabel(trade.programId)
      }
    });
  }

  return { trade: chainTrade.toObject(), violations };
}

function evaluateChainConstraint(rule, trade, walletLink) {
  const constraints = rule.compiledRule?.chainConstraints;
  if (!constraints?.type) return { violated: false };

  if (!isScheduleActive(rule.compiledRule?.schedule)) {
    return { violated: false };
  }

  switch (constraints.type) {
    case 'max_trades_per_day':
      return evaluateMaxTradesPerDay(constraints, trade, walletLink);
    case 'max_position_size':
      return evaluateMaxPositionSize(constraints, trade);
    case 'max_daily_loss':
      return evaluateMaxDailyLoss(constraints, trade, walletLink);
    case 'blocked_tokens':
      return evaluateBlockedTokens(constraints, trade);
    case 'schedule_violation':
      return { violated: true, reason: 'Trade executed during a restricted time window.' };
    default:
      return { violated: false };
  }
}

async function evaluateMaxTradesPerDay(constraints, trade, walletLink) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayTradeCount = await ChainTrade.countDocuments({
    walletAddress: walletLink.walletAddress,
    timestamp: { $gte: startOfDay }
  });

  const maxTrades = constraints.maxTrades || 5;
  if (todayTradeCount >= maxTrades) {
    return {
      violated: true,
      reason: `Trade #${todayTradeCount + 1} exceeds your daily limit of ${maxTrades}.`
    };
  }
  return { violated: false };
}

function evaluateMaxPositionSize(constraints, trade) {
  const maxSol = constraints.maxPositionSizeSol || 2;
  if (trade.solAmount > maxSol) {
    return {
      violated: true,
      reason: `Position size ${trade.solAmount.toFixed(3)} SOL exceeds your limit of ${maxSol} SOL.`
    };
  }
  return { violated: false };
}

async function evaluateMaxDailyLoss(constraints, trade, walletLink) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayTrades = await ChainTrade.find({
    walletAddress: walletLink.walletAddress,
    timestamp: { $gte: startOfDay },
    direction: 'sell'
  }).lean();

  const totalLoss = todayTrades.reduce((sum, pastTrade) => sum + pastTrade.solAmount, 0);
  const maxLoss = constraints.maxDailyLossSol || 5;

  if (trade.direction === 'sell' && totalLoss + trade.solAmount > maxLoss) {
    return {
      violated: true,
      reason: `Total daily loss would exceed your limit of ${maxLoss} SOL.`
    };
  }
  return { violated: false };
}

function evaluateBlockedTokens(constraints, trade) {
  const blockedMints = constraints.blockedMints || [];
  if (trade.tokenMint && blockedMints.includes(trade.tokenMint)) {
    return {
      violated: true,
      reason: `Token ${trade.tokenMint.slice(0, 8)}... is on your blocked list.`
    };
  }
  return { violated: false };
}

export async function getTodayTradeCount(walletAddress) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return ChainTrade.countDocuments({ walletAddress, timestamp: { $gte: startOfDay } });
}

export async function getRecentTrades(walletAddress, limit = 20) {
  return ChainTrade.find({ walletAddress }).sort({ timestamp: -1 }).limit(limit).lean();
}
