/**
 * 将 wagmi/viem 钱包错误映射为对用户安全的文案（13-1；不在 UI 展示原始 RPC message）。
 */
export type EscrowChainTxErrorKind = "none" | "user_rejected" | "allowance" | "generic";

export function classifyEscrowChainTxError(raw: string | null | undefined): EscrowChainTxErrorKind {
  const s = raw?.trim() ?? "";
  if (!s) return "none";
  if (
    /User rejected|user rejected|User denied|denied transaction|ACTION_REJECTED|rejected the request|4001|user cancel/i.test(
      s
    )
  ) {
    return "user_rejected";
  }
  if (
    /allowance|approve|ERC20|insufficient allowance|insufficient funds|exceeds allowance|ERC20InsufficientAllowance|transfer amount exceeds allowance|BEP20/i.test(
      s
    )
  ) {
    return "allowance";
  }
  return "generic";
}

export function escrowChainTxErrorUserMessage(
  raw: string | null | undefined,
  t: (key: string) => string
): string {
  switch (classifyEscrowChainTxError(raw)) {
    case "none":
      return "";
    case "user_rejected":
      return t("escrow_txErrorUserRejected");
    case "allowance":
      return t("escrow_allowanceHint");
    default:
      return t("escrow_txErrorGeneric");
  }
}
