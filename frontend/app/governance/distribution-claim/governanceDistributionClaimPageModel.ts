import claimAbi from "@/dapp/abis/InvestorDistributionClaim.json";
import { mapWalletWriteError } from "@/lib/mapWalletWriteError";

export const READ_ABI = claimAbi as readonly unknown[];

/** Wagmi read `data` for uint256 is bigint at runtime; narrow for TS without mutating values. */
export function asReadonlyBigint(v: unknown): bigint | undefined {
  return typeof v === "bigint" ? v : undefined;
}

export const CLAIM_WRITE_ERROR_OPTS = {
  revertPatterns: [
    { re: /NothingToClaim/i, messageKey: "governance_claim_err_nothing" },
    { re: /UnknownDistribution/i, messageKey: "governance_claim_err_unknown" },
    { re: /TransferFailed/i, messageKey: "governance_claim_err_transfer" },
    { re: /TokenMismatch/i, messageKey: "governance_claim_err_token_mismatch" },
    { re: /OnlyOwner/i, messageKey: "governance_claim_err_only_owner" },
  ],
  rejectKey: "wallet_txErrorUserRejected",
  genericKey: "governance_claim_err_generic",
} as const;

export function simulateErrToMessage(raw: string, t: (k: string) => string): string {
  const opts = { ...CLAIM_WRITE_ERROR_OPTS, rejectKey: "wallet_txErrorUserRejected" as const };
  return mapWalletWriteError(new Error(raw), t, opts) ?? t("governance_claim_err_generic");
}
