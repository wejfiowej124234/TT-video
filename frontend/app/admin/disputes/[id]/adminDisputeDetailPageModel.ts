export type AdminDisputeDetailRes = {
  status?: string;
  error?: string;
  dispute?: Record<string, unknown>;
  meta?: unknown;
};

export function adminDisputeDetailFmt(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Field keys aligned with public `GET /api/v1/disputes/:id` dispute object. */
export const ADMIN_DISPUTE_DETAIL_FIELD_DEFS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_disputes_colDisputeId" },
  { key: "order_id", labelKey: "admin_disputes_colOrderId" },
  { key: "status", labelKey: "admin_disputes_colStatus" },
  { key: "arbitrator_id", labelKey: "admin_disputes_colArbitrator" },
  { key: "refund_ratio", labelKey: "admin_dispute_detail_refundRatio" },
  { key: "slash_guide", labelKey: "admin_dispute_detail_slashGuide" },
  { key: "dispute_sequence", labelKey: "admin_dispute_detail_sequence" },
  { key: "arb_fee_paid", labelKey: "admin_dispute_detail_arbFeePaid" },
  { key: "created_at", labelKey: "admin_disputes_colCreated" },
  { key: "updated_at", labelKey: "admin_dispute_detail_updatedAt" },
  { key: "resolved_at", labelKey: "admin_dispute_detail_resolvedAt" },
];
