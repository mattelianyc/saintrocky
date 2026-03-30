import { solToLamports, lamportsToSol } from '@saintrocky/chain';
import { WalletLink } from '../models/wallet-link.model.js';
import { logger } from '../logger.js';

let escrowClient = null;

export function setEscrowClient(client) {
  escrowClient = client;
}

async function syncWalletVaultState(walletAddress, vault) {
  if (!walletAddress || !vault?.address) {
    return;
  }

  await WalletLink.updateOne(
    { walletAddress },
    {
      $set: {
        escrowVaultAddress: vault.address,
        escrowBalanceLamports: vault.balanceLamports
      }
    }
  );
}

export async function getInitializedEscrowVault(walletAddress) {
  if (!escrowClient || !walletAddress) {
    return null;
  }

  try {
    const vault = await escrowClient.getUserVault(walletAddress);
    if (!vault) {
      return null;
    }

    await syncWalletVaultState(walletAddress, vault);
    return vault;
  } catch (error) {
    logger.error(`Failed to fetch initialized escrow vault: ${error.message}`);
    return null;
  }
}

export async function recordPenaltyLamportsOnChain({
  walletAddress,
  violationId,
  amountLamports
}) {
  if (!escrowClient) {
    logger.warn('Escrow client not initialized, skipping on-chain penalty.');
    return null;
  }

  const vault = await getInitializedEscrowVault(walletAddress);
  if (!vault?.address) {
    logger.warn(`No escrow vault found for wallet ${walletAddress}`);
    return null;
  }

  try {
    const result = await escrowClient.recordPenalty(walletAddress, amountLamports, violationId);

    await WalletLink.updateOne(
      { walletAddress },
      { $set: { escrowVaultAddress: vault.address }, $inc: { escrowBalanceLamports: -amountLamports } }
    );

    logger.info(
      `Penalty recorded on-chain: ${lamportsToSol(amountLamports)} SOL from ${walletAddress} for violation ${violationId}`
    );
    return result;
  } catch (error) {
    logger.error(`Failed to record penalty on-chain: ${error.message}`);
    return null;
  }
}

export async function recordPenaltyOnChain({ walletAddress, violationId, penaltySol = 0.01 }) {
  return recordPenaltyLamportsOnChain({
    walletAddress,
    violationId,
    amountLamports: solToLamports(penaltySol)
  });
}

export async function distributeRewardsOnChain({ walletAddress, rewardSol }) {
  if (!escrowClient) {
    logger.warn('Escrow client not initialized, skipping on-chain reward.');
    return null;
  }

  const vault = await getInitializedEscrowVault(walletAddress);
  if (!vault?.address) {
    logger.warn(`No escrow vault found for wallet ${walletAddress}`);
    return null;
  }

  try {
    const amountLamports = solToLamports(rewardSol);
    const result = await escrowClient.distributeRewards(walletAddress, amountLamports);

    await WalletLink.updateOne(
      { walletAddress },
      { $set: { escrowVaultAddress: vault.address }, $inc: { escrowBalanceLamports: amountLamports } }
    );

    logger.info(`Reward distributed on-chain: ${rewardSol} SOL to ${walletAddress}`);
    return result;
  } catch (error) {
    logger.error(`Failed to distribute reward on-chain: ${error.message}`);
    return null;
  }
}

export async function getEscrowBalance(walletAddress) {
  const vault = await getInitializedEscrowVault(walletAddress);
  if (!vault) return null;

  return {
    address: vault.address,
    balanceLamports: vault.balanceLamports,
    balanceSol: lamportsToSol(vault.balanceLamports),
    lockedLamports: vault.lockedLamports || 0,
    lockedSol: lamportsToSol(vault.lockedLamports || 0),
    availableLamports: vault.availableLamports ?? vault.balanceLamports,
    availableSol: lamportsToSol(vault.availableLamports ?? vault.balanceLamports),
    totalDeposited: lamportsToSol(vault.totalDeposited),
    totalPenalties: lamportsToSol(vault.totalPenalties),
    totalRewards: lamportsToSol(vault.totalRewards),
    penaltyCount: vault.penaltyCount,
    lastWithdrawalAt: vault.lastWithdrawalAt || 0
  };
}
