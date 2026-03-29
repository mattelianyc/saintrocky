use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Insufficient vault balance for this penalty.")]
    InsufficientBalance,

    #[msg("Unauthorized: only the platform authority can perform this action.")]
    UnauthorizedAuthority,

    #[msg("Unauthorized: only the vault owner can perform this action.")]
    UnauthorizedOwner,

    #[msg("Penalty amount must be greater than zero.")]
    ZeroPenalty,

    #[msg("Reward amount must be greater than zero.")]
    ZeroReward,

    #[msg("Deposit amount must be greater than zero.")]
    ZeroDeposit,

    #[msg("Withdrawal amount must be greater than zero.")]
    ZeroWithdrawal,

    #[msg("Vault has already been initialized.")]
    VaultAlreadyInitialized,

    #[msg("Fee pool has insufficient balance for reward distribution.")]
    InsufficientFeePool,

    #[msg("Cannot withdraw more than the available balance.")]
    ExcessiveWithdrawal,
}
