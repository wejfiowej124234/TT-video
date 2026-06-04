export type AdminApprovalDetailRes = {
  status?: string;
  error?: string;
  approval_request?: Record<string, unknown>;
  meta?: unknown;
};

export function fmtApprovalDetailValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export const APPROVAL_DETAIL_ROW_DEFS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_approvals_colId" },
  { key: "action", labelKey: "admin_approvals_colAction" },
  { key: "resource_type", labelKey: "admin_approval_detail_resourceType" },
  { key: "resource_id", labelKey: "admin_approval_detail_resourceId" },
  { key: "requested_by", labelKey: "admin_approvals_colRequestedBy" },
  { key: "approved_by", labelKey: "admin_approval_detail_approvedBy" },
  { key: "status", labelKey: "admin_approvals_colStatus" },
  { key: "reason", labelKey: "admin_approval_detail_reason" },
  { key: "approve_reason", labelKey: "admin_approval_detail_approveReason" },
  { key: "created_at", labelKey: "admin_approval_detail_createdAt" },
  { key: "approved_at", labelKey: "admin_approval_detail_approvedAt" },
  { key: "before_payload", labelKey: "admin_approval_detail_beforePayload" },
  { key: "after_payload", labelKey: "admin_approval_detail_afterPayload" },
];
