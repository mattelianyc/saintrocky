use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub fee_pool: Pubkey,
    pub total_penalties_collected: u64,
    pub total_rewards_distributed: u64,
    pub total_vaults: u64,
    pub penalty_fee_bps: u16,
    pub bump: u8,
}

impl PlatformConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 2 + 1;
    pub const SEED: &'static [u8] = b"platform_config";
}

#[account]
#[derive(Default)]
pub struct UserVault {
    pub owner: Pubkey,
    pub balance_lamports: u64,
    pub total_deposited: u64,
    pub total_penalties: u64,
    pub total_rewards: u64,
    pub penalty_count: u64,
    pub last_deposit_at: i64,
    pub last_penalty_at: i64,
    pub bump: u8,
}

impl UserVault {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1;
    pub const SEED: &'static [u8] = b"user_vault";
}

#[account]
#[derive(Default)]
pub struct FeePool {
    pub balance_lamports: u64,
    pub total_collected: u64,
    pub total_distributed: u64,
    pub bump: u8,
}

impl FeePool {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 1;
    pub const SEED: &'static [u8] = b"fee_pool";
}
