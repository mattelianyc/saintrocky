import { ChainTrade } from '../models/chain-trade.model.js';
import { WalletLink } from '../models/wallet-link.model.js';

function getStartOfCurrentDay() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

function getEndOfCurrentDay() {
  const endOfDay = getStartOfCurrentDay();
  endOfDay.setDate(endOfDay.getDate() + 1);
  return endOfDay;
}

export async function listUserWalletAddresses(userId) {
  if (!userId) {
    return [];
  }

  const walletLinks = await WalletLink.find({
    userId,
    chain: 'solana'
  })
    .select({ walletAddress: 1, _id: 0 })
    .lean();

  return walletLinks
    .map((walletLink) => walletLink.walletAddress)
    .filter(Boolean);
}

export async function getTodayTradeCountForWalletAddresses(walletAddresses = []) {
  if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
    return 0;
  }

  return ChainTrade.countDocuments({
    walletAddress: { $in: walletAddresses },
    timestamp: { $gte: getStartOfCurrentDay() }
  });
}

export async function getTodaySellVolumeForWalletAddresses(walletAddresses = []) {
  if (!Array.isArray(walletAddresses) || walletAddresses.length === 0) {
    return 0;
  }

  const todayTrades = await ChainTrade.find({
    walletAddress: { $in: walletAddresses },
    timestamp: { $gte: getStartOfCurrentDay() },
    direction: 'sell'
  })
    .select({ solAmount: 1, _id: 0 })
    .lean();

  return todayTrades.reduce((sum, trade) => sum + Number(trade.solAmount || 0), 0);
}

export async function resolveBrowserRuleEnforcementState(rule, walletAddresses = []) {
  const constraints = rule?.compiledRule?.chainConstraints;
  if (!constraints?.type) {
    return {
      isEnforcementActive: true,
      reason: '',
      currentValue: null,
      threshold: null,
      activeUntil: null
    };
  }

  if (constraints.type === 'max_trades_per_day') {
    const maxTrades = Number(constraints.maxTrades || 5);
    const todayTradeCount = await getTodayTradeCountForWalletAddresses(walletAddresses);
    return {
      isEnforcementActive: todayTradeCount >= maxTrades,
      reason:
        todayTradeCount >= maxTrades
          ? `Daily trade cap reached: ${todayTradeCount}/${maxTrades}.`
          : '',
      currentValue: todayTradeCount,
      threshold: maxTrades,
      activeUntil: getEndOfCurrentDay().toISOString()
    };
  }

  if (constraints.type === 'max_daily_loss') {
    const maxDailyLossSol = Number(constraints.maxDailyLossSol || 5);
    const todaySellVolume = await getTodaySellVolumeForWalletAddresses(walletAddresses);
    return {
      isEnforcementActive: todaySellVolume >= maxDailyLossSol,
      reason:
        todaySellVolume >= maxDailyLossSol
          ? `Daily loss cap reached: ${todaySellVolume.toFixed(3)} SOL / ${maxDailyLossSol} SOL.`
          : '',
      currentValue: todaySellVolume,
      threshold: maxDailyLossSol,
      activeUntil: getEndOfCurrentDay().toISOString()
    };
  }

  return {
    isEnforcementActive: true,
    reason: '',
    currentValue: null,
    threshold: null,
    activeUntil: null
  };
}
