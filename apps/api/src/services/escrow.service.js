import { solToLamports, lamportsToSol } from '@saintrocky/chain';
import { WalletLink } from '../models/wallet-link.model.js';
import { logger } from '../logger.js';

let escrowClient = null;

export function setEscrowClient(client) {
  escrowClient = client;
}

export async function recordPenaltyOnChain({ walletAddress, violationId, penaltySol = 0.01 }) {
  if (!escrowClient) {
    logger.warn('Escrow client not initialized, skipping on-chain penalty.');
    return null;
  }

  const wallet = await WalletLink.findOne({ walletAddress }).lean();
  if (!wallet?.escrowVaultAddress) {
    logger.warn(`No escrow vault found for wallet ${walletAddress}`);
    return null;
  }

  try {
    const amountLamports = solToLamports(penaltySol);
    const result = await escrowClient.recordPenalty(walletAddress, amountLamports, violationId);

    await WalletLink.updateOne(
      { walletAddress },
      { $inc: { escrowBalanceLamports: -amountLamports } }
    );

    logger.info(`Penalty recorded on-chain: ${penaltySol} SOL from ${walletAddress} for violation ${violationId}`);
    return result;
  } catch (error) {
    logger.error(`Failed to record penalty on-chain: ${error.message}`);
    return null;
  }
}

export async function distributeRewardsOnChain({ walletAddress, rewardSol }) {
  if (!escrowClient) {
    logger.warn('Escrow client not initialized, skipping on-chain reward.');
    return null;
  }

  const wallet = await WalletLink.findOne({ walletAddress }).lean();
  if (!wallet?.escrowVaultAddress) {
    logger.warn(`No escrow vault found for wallet ${walletAddress}`);
    return null;
  }

  try {
    const amountLamports = solToLamports(rewardSol);
    const result = await escrowClient.distributeRewards(walletAddress, amountLamports);

    await WalletLink.updateOne(
      { walletAddress },
      { $inc: { escrowBalanceLamports: amountLamports } }
    );

    logger.info(`Reward distributed on-chain: ${rewardSol} SOL to ${walletAddress}`);
    return result;
  } catch (error) {
    logger.error(`Failed to distribute reward on-chain: ${error.message}`);
    return null;
  }
}

export async function getEscrowBalance(walletAddress) {
  if (!escrowClient) return null;

  try {
    const vault = await escrowClient.getUserVault(walletAddress);
    if (!vault) return null;

    return {
      balanceLamports: vault.balanceLamports,
      balanceSol: lamportsToSol(vault.balanceLamports),
      totalDeposited: lamportsToSol(vault.totalDeposited),
      totalPenalties: lamportsToSol(vault.totalPenalties),
      totalRewards: lamportsToSol(vault.totalRewards),
      penaltyCount: vault.penaltyCount
    };
  } catch (error) {
    logger.error(`Failed to fetch escrow balance: ${error.message}`);
    return null;
  }
}
