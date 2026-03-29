import * as anchorModule from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

const anchor = anchorModule.default || anchorModule;
const { Program, AnchorProvider, BN } = anchor;

import {
  ESCROW_PROGRAM_ID,
  findPlatformConfigAddress,
  findUserVaultAddress,
  findFeePoolAddress
} from './constants.js';

export function createEscrowClient({ connection, wallet, idl }) {
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(idl, provider);

  async function initializePlatform(penaltyFeeBps = 100) {
    const [platformConfig] = findPlatformConfigAddress();
    const [feePool] = findFeePoolAddress();

    const transaction = await program.methods
      .initializePlatform(penaltyFeeBps)
      .accounts({
        platformConfig,
        feePool,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    return { transaction, platformConfig: platformConfig.toBase58(), feePool: feePool.toBase58() };
  }

  async function createUserVault() {
    const [userVault] = findUserVaultAddress(wallet.publicKey);

    const transaction = await program.methods
      .createUserVault()
      .accounts({
        userVault,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    return { transaction, vaultAddress: userVault.toBase58() };
  }

  async function deposit(amountLamports) {
    const [userVault] = findUserVaultAddress(wallet.publicKey);

    const transaction = await program.methods
      .deposit(new BN(amountLamports))
      .accounts({
        userVault,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    return { transaction };
  }

  async function recordPenalty(vaultOwnerPublicKey, amountLamports, violationId) {
    const [platformConfig] = findPlatformConfigAddress();
    const [userVault] = findUserVaultAddress(vaultOwnerPublicKey);
    const [feePool] = findFeePoolAddress();

    const transaction = await program.methods
      .recordPenalty(new BN(amountLamports), violationId)
      .accounts({
        platformConfig,
        userVault,
        feePool,
        vaultOwner: new PublicKey(vaultOwnerPublicKey),
        authority: wallet.publicKey
      })
      .rpc();

    return { transaction };
  }

  async function distributeRewards(vaultOwnerPublicKey, amountLamports) {
    const [platformConfig] = findPlatformConfigAddress();
    const [userVault] = findUserVaultAddress(vaultOwnerPublicKey);
    const [feePool] = findFeePoolAddress();

    const transaction = await program.methods
      .distributeRewards(new BN(amountLamports))
      .accounts({
        platformConfig,
        userVault,
        feePool,
        vaultOwner: new PublicKey(vaultOwnerPublicKey),
        authority: wallet.publicKey
      })
      .rpc();

    return { transaction };
  }

  async function withdraw(amountLamports) {
    const [userVault] = findUserVaultAddress(wallet.publicKey);

    const transaction = await program.methods
      .withdraw(new BN(amountLamports))
      .accounts({
        userVault,
        owner: wallet.publicKey
      })
      .rpc();

    return { transaction };
  }

  async function getUserVault(ownerPublicKey) {
    const [userVault] = findUserVaultAddress(ownerPublicKey || wallet.publicKey);
    try {
      const account = await program.account.userVault.fetch(userVault);
      return {
        address: userVault.toBase58(),
        owner: account.owner.toBase58(),
        balanceLamports: account.balanceLamports.toNumber(),
        totalDeposited: account.totalDeposited.toNumber(),
        totalPenalties: account.totalPenalties.toNumber(),
        totalRewards: account.totalRewards.toNumber(),
        penaltyCount: account.penaltyCount.toNumber(),
        lastDepositAt: account.lastDepositAt.toNumber(),
        lastPenaltyAt: account.lastPenaltyAt.toNumber()
      };
    } catch {
      return null;
    }
  }

  async function getPlatformConfig() {
    const [platformConfig] = findPlatformConfigAddress();
    try {
      const account = await program.account.platformConfig.fetch(platformConfig);
      return {
        address: platformConfig.toBase58(),
        authority: account.authority.toBase58(),
        feePool: account.feePool.toBase58(),
        totalPenaltiesCollected: account.totalPenaltiesCollected.toNumber(),
        totalRewardsDistributed: account.totalRewardsDistributed.toNumber(),
        totalVaults: account.totalVaults.toNumber(),
        penaltyFeeBps: account.penaltyFeeBps
      };
    } catch {
      return null;
    }
  }

  async function getFeePool() {
    const [feePool] = findFeePoolAddress();
    try {
      const account = await program.account.feePool.fetch(feePool);
      return {
        address: feePool.toBase58(),
        balanceLamports: account.balanceLamports.toNumber(),
        totalCollected: account.totalCollected.toNumber(),
        totalDistributed: account.totalDistributed.toNumber()
      };
    } catch {
      return null;
    }
  }

  return {
    program,
    provider,
    initializePlatform,
    createUserVault,
    deposit,
    recordPenalty,
    distributeRewards,
    withdraw,
    getUserVault,
    getPlatformConfig,
    getFeePool
  };
}
