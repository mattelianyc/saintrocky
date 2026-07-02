import { MEMBER_ROLE } from '@saintrocky/shared';
import { ChainTrade } from '../models/chain-trade.model.js';
import { UserRule } from '../models/user-rule.model.js';
import { User } from '../models/user.model.js';
import { WalletLink } from '../models/wallet-link.model.js';

const LAMPORTS_PER_SOL = 1_000_000_000;
const LOOKBACK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function roundTo(value, precision = 1) {
  const factor = 10 ** precision;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function toSol(lamports) {
  return roundTo((Number(lamports) || 0) / LAMPORTS_PER_SOL, 3);
}

function resolveDisplayName(user) {
  return user?.name || user?.displayName || user?.email?.split('@')[0] || 'Anonymous';
}

function getCleanStreakDays(latestViolationTrade, hasRecentTrades) {
  if (!hasRecentTrades) return 0;
  if (!latestViolationTrade?.timestamp) return 30;
  const elapsedMs = Date.now() - new Date(latestViolationTrade.timestamp).getTime();
  return Math.max(0, Math.min(30, Math.floor(elapsedMs / (24 * 60 * 60 * 1000))));
}

export async function computeDisciplineScores() {
  const activeUsers = await User.find({ role: MEMBER_ROLE, deletionRequestedAt: null }).lean();
  const scores = await Promise.all(
    activeUsers.map(async (user) => {
      const score = await computeUserDisciplineScore(user.email);
      if (!score) return null;
      return {
        userId: user._id?.toString(),
        email: user.email,
        displayName: resolveDisplayName(user),
        ...score
      };
    })
  );

  const rankedScores = scores
    .filter(Boolean)
    .sort((left, right) => {
      if (right.disciplineScore !== left.disciplineScore) {
        return right.disciplineScore - left.disciplineScore;
      }
      if (right.cleanStreak !== left.cleanStreak) {
        return right.cleanStreak - left.cleanStreak;
      }
      return left.totalViolations - right.totalViolations;
    });

  return rankedScores.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    totalTraders: rankedScores.length
  }));
}

export async function computeUserDisciplineScore(userEmail) {
  const normalizedEmail = String(userEmail || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  const thirtyDaysAgo = new Date(Date.now() - LOOKBACK_WINDOW_MS);

  const [activeRules, wallets] = await Promise.all([
    UserRule.find({
      ownerEmail: normalizedEmail,
      status: 'active'
    }).lean(),
    WalletLink.find({ userEmail: normalizedEmail }).lean()
  ]);

  if (!activeRules.length) return null;

  const walletAddresses = wallets.map((wallet) => wallet.walletAddress);
  const totalEscrowLamports = wallets.reduce(
    (sum, wallet) => sum + (wallet.escrowBalanceLamports || 0),
    0
  );
  const totalLockedStakeLamports = activeRules.reduce(
    (sum, rule) => sum + (rule.lockedStakeLamports || 0),
    0
  );

  let totalTrades = 0;
  let totalViolations = 0;
  let latestViolationTrade = null;

  if (walletAddresses.length) {
    const [recentTradeCount, recentViolationCount, latestViolation] = await Promise.all([
      ChainTrade.countDocuments({
        walletAddress: { $in: walletAddresses },
        timestamp: { $gte: thirtyDaysAgo }
      }),
      ChainTrade.countDocuments({
        walletAddress: { $in: walletAddresses },
        timestamp: { $gte: thirtyDaysAgo },
        isViolation: true
      }),
      ChainTrade.findOne({
        walletAddress: { $in: walletAddresses },
        isViolation: true
      })
        .sort({ timestamp: -1 })
        .lean()
    ]);

    totalTrades = recentTradeCount;
    totalViolations = recentViolationCount;
    latestViolationTrade = latestViolation;
  }

  const complianceRate = totalTrades > 0
    ? ((totalTrades - totalViolations) / totalTrades) * 100
    : 100;
  const cleanStreak = getCleanStreakDays(latestViolationTrade, totalTrades > 0);
  const activeRuleCount = activeRules.length;
  const escrowBalanceSol = toSol(totalEscrowLamports);
  const lockedStakeSol = toSol(totalLockedStakeLamports);

  const ruleCommitmentScore = Math.min(activeRuleCount * 4, 20);
  const complianceScore = Math.min((complianceRate / 100) * 45, 45);
  const escrowCommitmentScore = Math.min(escrowBalanceSol * 1.5, 15);
  const lockedStakeScore = Math.min(lockedStakeSol * 0.5, 10);
  const streakBonus = Math.min(cleanStreak / 3, 10);
  const disciplineScore = Math.min(
    100,
    Math.round(
      ruleCommitmentScore +
      complianceScore +
      escrowCommitmentScore +
      lockedStakeScore +
      streakBonus
    )
  );

  const earningsSol = roundTo(escrowBalanceSol * (complianceRate / 100) * 0.5, 3);

  return {
    disciplineScore,
    activeRuleCount,
    totalTrades,
    totalViolations,
    complianceRate: roundTo(complianceRate, 1),
    escrowBalanceSol,
    lockedStakeSol,
    earningsSol,
    walletCount: walletAddresses.length,
    cleanStreak,
    periodDays: 30
  };
}

export async function getLeaderboard(limit = 50) {
  const allScores = await computeDisciplineScores();
  return allScores.slice(0, limit);
}
