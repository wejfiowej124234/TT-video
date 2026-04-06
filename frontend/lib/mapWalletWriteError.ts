/**
 * 钱包 writeContract 错误 → 用户可见文案（13-1）；原始 message 仅用于控制台。
 */
export function walletErrorRaw(err: Error | null | undefined): string {
  if (!err) return "";
  const sm = (err as { shortMessage?: string }).shortMessage ?? "";
  return `${err.message} ${sm}`.trim();
}

export interface MapWalletWriteErrorOpts {
  /** 优先匹配合约 revert / 典型子串（可与 `as const` 配置兼容） */
  revertPatterns: ReadonlyArray<{ re: RegExp; messageKey: string }>;
  rejectKey?: string;
  allowanceKey?: string;
  genericKey?: string;
}

export function mapWalletWriteError(
  err: Error | null | undefined,
  t: (key: string) => string,
  opts: MapWalletWriteErrorOpts
): string | null {
  const raw = walletErrorRaw(err);
  if (!raw) return null;
  for (const { re, messageKey } of opts.revertPatterns) {
    if (re.test(raw)) return t(messageKey);
  }
  if (
    /User rejected|user rejected|User denied|denied transaction|ACTION_REJECTED|rejected the request|4001|user cancel/i.test(
      raw
    )
  ) {
    return t(opts.rejectKey ?? "wallet_txErrorUserRejected");
  }
  if (
    /allowance|approve|ERC20|insufficient allowance|exceeds allowance|insufficient funds|ERC20InsufficientAllowance|transfer amount exceeds allowance|BEP20/i.test(
      raw
    )
  ) {
    return t(opts.allowanceKey ?? "staking_stake_errAllowance");
  }
  return t(opts.genericKey ?? "wallet_txErrorGeneric");
}
