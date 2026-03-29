use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub mod errors;
pub mod state;

use errors::EscrowError;
use state::{FeePool, PlatformConfig, UserVault};

declare_id!("EXNdWwQipapxRhAMdYk15BLiiS1zZ2Wp3yCSF5jWdnwx");

#[program]
pub mod saintrocky_escrow {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        penalty_fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.fee_pool = ctx.accounts.fee_pool.key();
        config.penalty_fee_bps = penalty_fee_bps;
        config.bump = ctx.bumps.platform_config;

        let pool = &mut ctx.accounts.fee_pool;
        pool.bump = ctx.bumps.fee_pool;

        Ok(())
    }

    pub fn create_user_vault(ctx: Context<CreateUserVault>) -> Result<()> {
        let vault = &mut ctx.accounts.user_vault;
        vault.owner = ctx.accounts.owner.key();
        vault.bump = ctx.bumps.user_vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroDeposit);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.user_vault.to_account_info(),
                },
            ),
            amount,
        )?;

        let vault = &mut ctx.accounts.user_vault;
        vault.balance_lamports = vault.balance_lamports.checked_add(amount).unwrap();
        vault.total_deposited = vault.total_deposited.checked_add(amount).unwrap();
        vault.last_deposit_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn record_penalty(
        ctx: Context<RecordPenalty>,
        amount: u64,
        _violation_id: String,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroPenalty);

        let vault = &mut ctx.accounts.user_vault;
        require!(
            vault.balance_lamports >= amount,
            EscrowError::InsufficientBalance
        );

        vault.balance_lamports = vault.balance_lamports.checked_sub(amount).unwrap();
        vault.total_penalties = vault.total_penalties.checked_add(amount).unwrap();
        vault.penalty_count = vault.penalty_count.checked_add(1).unwrap();
        vault.last_penalty_at = Clock::get()?.unix_timestamp;

        let pool = &mut ctx.accounts.fee_pool;
        pool.balance_lamports = pool.balance_lamports.checked_add(amount).unwrap();
        pool.total_collected = pool.total_collected.checked_add(amount).unwrap();

        let config = &mut ctx.accounts.platform_config;
        config.total_penalties_collected = config
            .total_penalties_collected
            .checked_add(amount)
            .unwrap();

        Ok(())
    }

    pub fn distribute_rewards(
        ctx: Context<DistributeRewards>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroReward);

        let pool = &mut ctx.accounts.fee_pool;
        require!(
            pool.balance_lamports >= amount,
            EscrowError::InsufficientFeePool
        );

        pool.balance_lamports = pool.balance_lamports.checked_sub(amount).unwrap();
        pool.total_distributed = pool.total_distributed.checked_add(amount).unwrap();

        let vault = &mut ctx.accounts.user_vault;
        vault.balance_lamports = vault.balance_lamports.checked_add(amount).unwrap();
        vault.total_rewards = vault.total_rewards.checked_add(amount).unwrap();

        let config = &mut ctx.accounts.platform_config;
        config.total_rewards_distributed = config
            .total_rewards_distributed
            .checked_add(amount)
            .unwrap();

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroWithdrawal);

        let vault = &mut ctx.accounts.user_vault;
        require!(
            vault.balance_lamports >= amount,
            EscrowError::ExcessiveWithdrawal
        );

        vault.balance_lamports = vault.balance_lamports.checked_sub(amount).unwrap();

        let vault_account_info = vault.to_account_info();
        let owner_account_info = ctx.accounts.owner.to_account_info();

        **vault_account_info.try_borrow_mut_lamports()? -= amount;
        **owner_account_info.try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = PlatformConfig::LEN,
        seeds = [PlatformConfig::SEED],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = authority,
        space = FeePool::LEN,
        seeds = [FeePool::SEED],
        bump
    )]
    pub fee_pool: Account<'info, FeePool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserVault<'info> {
    #[account(
        init,
        payer = owner,
        space = UserVault::LEN,
        seeds = [UserVault::SEED, owner.key().as_ref()],
        bump
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [UserVault::SEED, owner.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.owner == owner.key() @ EscrowError::UnauthorizedOwner
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, violation_id: String)]
pub struct RecordPenalty<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [UserVault::SEED, vault_owner.key().as_ref()],
        bump = user_vault.bump,
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(
        mut,
        seeds = [FeePool::SEED],
        bump = fee_pool.bump,
    )]
    pub fee_pool: Account<'info, FeePool>,

    /// CHECK: The wallet address that owns this vault
    pub vault_owner: UncheckedAccount<'info>,

    #[account(
        constraint = authority.key() == platform_config.authority @ EscrowError::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [UserVault::SEED, vault_owner.key().as_ref()],
        bump = user_vault.bump,
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(
        mut,
        seeds = [FeePool::SEED],
        bump = fee_pool.bump,
    )]
    pub fee_pool: Account<'info, FeePool>,

    /// CHECK: The wallet address that owns this vault
    pub vault_owner: UncheckedAccount<'info>,

    #[account(
        constraint = authority.key() == platform_config.authority @ EscrowError::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [UserVault::SEED, owner.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.owner == owner.key() @ EscrowError::UnauthorizedOwner
    )]
    pub user_vault: Account<'info, UserVault>,

    #[account(mut)]
    pub owner: Signer<'info>,
}
