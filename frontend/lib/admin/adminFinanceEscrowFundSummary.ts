/**
 * Batch-11 W08 HU-399 · Escrow fund summary buckets (readonly · no state-machine write)
 */
import type { FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";

export type EscrowFundBucketId = "locked" | "pending_release" | "in_dispute";

export type EscrowFundBucket = {
  id: EscrowFundBucketId;
  labelKey: string;
  count: number;
  href: string;
};

const LOCKED_STATES = ["escrowed", "funded", "accepted", "paid"] as const;
const PENDING_RELEASE_STATES = ["completed"] as const;
const DISPUTE_STATES = ["disputed"] as const;

function sumStates(counts: Record<string, number> | undefined, keys: readonly string[]): number {
  if (!counts) return 0;
  let n = 0;
  for (const k of keys) n += Number(counts[k] ?? 0) || 0;
  return n;
}

/** Pure FE bucketing from finance summary — not on-chain balance SSOT. */
export function resolveEscrowFundSummaryBuckets(
  summary: FinanceSummary | null | undefined,
): EscrowFundBucket[] {
  const sc = summary?.state_counts;
  const locked = sumStates(sc, LOCKED_STATES);
  const pending = sumStates(sc, PENDING_RELEASE_STATES);
  const disputedOrders = sumStates(sc, DISPUTE_STATES);
  const disputeCount = Number(summary?.dispute_count ?? 0) || 0;
  const inDispute = Math.max(disputedOrders, disputeCount);

  return [
    {
      id: "locked",
      labelKey: "admin_fin_escrow_bucket_locked",
      count: locked,
      href: "/admin/orders?state=escrowed",
    },
    {
      id: "pending_release",
      labelKey: "admin_fin_escrow_bucket_pending_release",
      count: pending,
      href: "/admin/orders?state=completed",
    },
    {
      id: "in_dispute",
      labelKey: "admin_fin_escrow_bucket_in_dispute",
      count: inDispute,
      href: "/admin/disputes",
    },
  ];
}
