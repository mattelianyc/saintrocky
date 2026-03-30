import { PublicKey } from '@solana/web3.js';

export const ESCROW_PROGRAM_ID = new PublicKey('CT1KzU4EtRSHyjTmFtemKcJGXcTQWc6K6He1PfpZuqsU');

export const PLATFORM_CONFIG_SEED = Buffer.from('platform_config');
export const USER_VAULT_SEED = Buffer.from('user_vault');
export const FEE_POOL_SEED = Buffer.from('fee_pool');

export function findPlatformConfigAddress() {
  return PublicKey.findProgramAddressSync([PLATFORM_CONFIG_SEED], ESCROW_PROGRAM_ID);
}

export function findUserVaultAddress(ownerPublicKey) {
  return PublicKey.findProgramAddressSync(
    [USER_VAULT_SEED, new PublicKey(ownerPublicKey).toBuffer()],
    ESCROW_PROGRAM_ID
  );
}

export function findFeePoolAddress() {
  return PublicKey.findProgramAddressSync([FEE_POOL_SEED], ESCROW_PROGRAM_ID);
}
