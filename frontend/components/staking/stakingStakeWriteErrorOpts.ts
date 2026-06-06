/** `mapWalletWriteError` 选项：质押 approve/stake 写入 */
export const STAKE_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /StakeBelowMinimum/i, messageKey: "staking_stake_errBelowMin" },
    { re: /TransferFailed/i, messageKey: "staking_stake_errTransfer" },
  ],
  rejectKey: "staking_stake_errRejected",
  allowanceKey: "staking_stake_errAllowance",
  genericKey: "staking_stake_errGeneric",
} as const;
