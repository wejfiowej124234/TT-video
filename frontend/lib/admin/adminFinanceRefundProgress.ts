/**
 * Batch-11 W08 HU-400 · Refund progress buckets (readonly · 非执行台)
 */
import type { FinanceSummary } from "@/app/admin/finance/adminFinancePageTypes";

export type RefundProgressBucketId =
  | "refunded"
  | "partially_refunded"
  | "slashed"
  | "open_dispute";

export type RefundProgressBucket = {
  id: RefundProgressBucketId;
  labelKey: string;
  count: number;
  href: string;
};

function countState(counts: Record<string, number> | undefined, key: string): number {
  return Number(counts?.[key] ?? 0) || 0;
}

export function resolveRefundProgressBuckets(
  summary: FinanceSummary | null | undefined,
  openDisputeCount?: number | null,
): RefundProgressBucket[] {
  const sc = summary?.state_counts;
  const openFromSummary =
    countState(summary?.dispute_status_counts, "open") ||
    countState(summary?.dispute_status_counts, "Open");
  const open =
    openDisputeCount != null && openDisputeCount >= 0
      ? openDisputeCount
      : openFromSummary || Number(summary?.dispute_count ?? 0) || 0;

  return [
    {
      id: "refunded",
      labelKey: "admin_fin_refund_bucket_refunded",
      count: countState(sc, "refunded"),
      href: "/admin/orders?state=refunded",
    },
    {
      id: "partially_refunded",
      labelKey: "admin_fin_refund_bucket_partially_refunded",
      count: countState(sc, "partially_refunded"),
      href: "/admin/orders?state=partially_refunded",
    },
    {
      id: "slashed",
      labelKey: "admin_fin_refund_bucket_slashed",
      count: countState(sc, "slashed"),
      href: "/admin/orders?state=slashed",
    },
    {
      id: "open_dispute",
      labelKey: "admin_fin_refund_bucket_open_dispute",
      count: open,
      href: "/admin/disputes?status=open",
    },
  ];
}
