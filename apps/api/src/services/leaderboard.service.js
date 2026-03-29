import { UserRule } from '../models/user-rule.model.js';
import { ChainTrade } from '../models/chain-trade.model.js';
import { WalletLink } from '../models/wallet-link.model.js';
import { User } from '../models/user.model.js';

export async function computeDisciplineScores() {
  const activeUsers = await User.find({ role: { $ne: 'owner' } }).lean();
  const scores = [];

  for (const user of activeUsers) {
    const score = await computeUserDisciplineScore(user.email);
    if (!score) continue;
    scores.push({
      userId: user._id?.toString(),
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      ...score
    });
  }

  scores.sort((a, b) => b.disciplineScore - a.disciplineScore);

  return scores.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}

export async function computeUserDisciplineScore(userEmail) {
  const normalizedEmail = String(userEmail).toLowerCase();

  const activeRuleCount = await UserRule.countDocuments({
    ownerEmail: normalizedEmail,
    status: 'active'
  });

  if (activeRuleCount === 0) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const wallets = await WalletLink.find({ userEmail: normalizedEmail }).lean();
  const walletAddresses = wallets.map((wallet) => wallet.walletAddress);

  let totalTrades = 0;
  let violationTrades = 0;
  let escrowBalanceSol = 0;

  if (walletAddresses.length > 0) {
    totalTrades = await ChainTrade.countDocuments({
      walletAddress: { $in: walletAddresses },
      timestamp: { $gte: thirtyDaysAgo }
    });

    violationTrades = await ChainTrade.countDocuments({
      walletAddress: { $in: walletAddresses },
      timestamp: { $gte: thirtyDaysAgo },
      isViolation: true
    });

    const totalEscrowLamports = wallets.reduce(
      (sum, wallet) => sum + (wallet.escrowBalanceLamports || 0),
      0
    );
    escrowBalanceSol = totalEscrowLamports / 1_000_000_000;
  }

  const complianceRate = totalTrades > 0
    ? ((totalTrades - violationTrades) / totalTrades) * 100
    : 100;

  const ruleCommitmentScore = Math.min(activeRuleCount * 10, 40);
  const complianceScore = (complianceRate / 100) * 40;
  const escrowCommitmentScore = Math.min(escrowBalanceSol * 2, 20);
  const disciplineScore = Math.round(ruleCommitmentScore + complianceScore + escrowCommitmentScore);

  return {
    disciplineScore: Math.min(disciplineScore, 100),
    activeRuleCount,
    totalTrades,
    violationTrades,
    complianceRate: Math.round(complianceRate * 10) / 10,
    escrowBalanceSol: Math.round(escrowBalanceSol * 1000) / 1000,
    walletCount: walletAddresses.length,
    periodDays: 30
  };
}

export async function getLeaderboard(limit = 50) {
  const allScores = await computeDisciplineScores();
  return allScores.slice(0, limit);
}
