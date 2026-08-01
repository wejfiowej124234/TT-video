/**
 * Batch-11 W10 · dispute loop honesty · HU-414 / HU-427
 * Admin readonly adjudication · public-page arbitration SOP
 * ≠ Escrow state-machine write · ≠ fund write · ≠ Production GO
 */

export const DISPUTE_OPS_L5_W10_PROBE = "dispute-ops-l5-batch11-w10-v1" as const;

/** HU-414 · Admin 不执行 resolution 写；仲裁只在公开页 */
export const DISPUTE_ADMIN_RESOLUTION_POLICY = "public_page_arbitration_only" as const;

export type DisputeSopStepId =
  | "read_status"
  | "review_evidence"
  | "open_public_arb"
  | "no_admin_fund_write";

export type DisputeSopStep = {
  id: DisputeSopStepId;
  labelKey: string;
};

export const DISPUTE_READONLY_SOP_STEPS: DisputeSopStep[] = [
  { id: "read_status", labelKey: "admin_dispute_sop_step_read_status" },
  { id: "review_evidence", labelKey: "admin_dispute_sop_step_review_evidence" },
  { id: "open_public_arb", labelKey: "admin_dispute_sop_step_open_public_arb" },
  { id: "no_admin_fund_write", labelKey: "admin_dispute_sop_step_no_admin_fund_write" },
];

export type DisputeAdjudicationDesk = {
  policy: typeof DISPUTE_ADMIN_RESOLUTION_POLICY;
  writeForbidden: true;
  escrowStateMachineWrite: "FORBIDDEN";
  financeWrite: "FORBIDDEN";
  adminWritePerm: "admin.disputes.write";
  adminWriteWired: false;
  readPerm: "admin.orders.read";
  publicHref: string | null;
  orderAdminHref: string | null;
  escrowHref: string | null;
  sopSteps: DisputeSopStep[];
  statusKey: string | null;
};

export function resolveDisputeAdjudicationDesk(input: {
  disputeId: string | null | undefined;
  orderId: string | null | undefined;
  status?: string | null;
}): DisputeAdjudicationDesk {
  const disputeId = typeof input.disputeId === "string" ? input.disputeId.trim() : "";
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  const status = typeof input.status === "string" ? input.status.trim() : "";

  return {
    policy: DISPUTE_ADMIN_RESOLUTION_POLICY,
    writeForbidden: true,
    escrowStateMachineWrite: "FORBIDDEN",
    financeWrite: "FORBIDDEN",
    adminWritePerm: "admin.disputes.write",
    adminWriteWired: false,
    readPerm: "admin.orders.read",
    publicHref: disputeId ? `/disputes/${encodeURIComponent(disputeId)}` : null,
    orderAdminHref: orderId ? `/admin/orders/${encodeURIComponent(orderId)}` : null,
    escrowHref: orderId ? `/escrow/${encodeURIComponent(orderId)}` : null,
    sopSteps: DISPUTE_READONLY_SOP_STEPS,
    statusKey: status || null,
  };
}

export type DisputeEvidenceTrailItem = {
  index: number;
  hash: string;
  kind: "content_hash" | "unknown";
};

function normalizeEvidenceHashes(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "—" || s === "-") return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return normalizeEvidenceHashes(parsed);
    } catch {
      /* plain string */
    }
    return [s];
  }
  return [];
}

/**
 * HU-427 · evidence 审计 trail（只读 · 非链上 sync 执行）
 */
export function resolveDisputeEvidenceAuditTrail(raw: unknown): DisputeEvidenceTrailItem[] {
  return normalizeEvidenceHashes(raw).map((hash, index) => ({
    index: index + 1,
    hash,
    kind: hash.startsWith("0x") || /^[a-f0-9]{32,}$/i.test(hash) ? "content_hash" : "unknown",
  }));
}

export const DISPUTE_EVIDENCE_CROSS_CHECK_HREF = "/admin/cross-check" as const;
