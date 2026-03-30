import { ChainTrade } from '../models/chain-trade.model.js';
import { UserRule } from '../models/user-rule.model.js';
import { WalletLink } from '../models/wallet-link.model.js';
import { computeUserDisciplineScore } from './leaderboard.service.js';

const LAMPORTS_PER_SOL = 1_000_000_000;
const RECENT_VIOLATIONS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function roundSol(lamports) {
  return Math.round(((Number(lamports) || 0) / LAMPORTS_PER_SOL) * 1000) / 1000;
}

export async function getDashboardSummaryForUser(userEmail) {
  const normalizedEmail = String(userEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Authenticated user email is required.');
  }

  const recentViolationsSince = new Date(Date.now() - RECENT_VIOLATIONS_WINDOW_MS);

  const [score, walletLinks, activeRules, recentViolations] = await Promise.all([
    computeUserDisciplineScore(normalizedEmail),
    WalletLink.find({ userEmail: normalizedEmail }).lean(),
    UserRule.countDocuments({ ownerEmail: normalizedEmail, status: 'active' }),
    ChainTrade.countDocuments({
      userEmail: normalizedEmail,
      isViolation: true,
      timestamp: { $gte: recentViolationsSince }
    })
  ]);

  const escrowBalanceLamports = walletLinks.reduce(
    (sum, walletLink) => sum + (walletLink.escrowBalanceLamports || 0),
    0
  );

  return {
    ok: true,
    counts: {
      disciplineScore: score?.disciplineScore ?? '—',
      escrowBalanceSol: roundSol(escrowBalanceLamports),
      activeRules,
      recentViolations
    },
    stats: {
      walletCount: walletLinks.length,
      totalTrades: score?.totalTrades ?? 0,
      complianceRate: score?.complianceRate ?? 100,
      cleanStreak: score?.cleanStreak ?? 0
    }
  };
}
