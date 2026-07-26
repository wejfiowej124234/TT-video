import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";
import { ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_OPS_OBSERVABILITY_RELATED_LINK } from "@/lib/admin/adminOpsListRelatedFoldLinks";

export type AdminApprovalDetailRes = {
  status?: string;
  error?: string;
  approval_request?: Record<string, unknown>;
  meta?: unknown;
};

export const APPROVAL_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  {
    href: ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF,
    labelKey: "admin_approval_detail_back_list",
    dataTt: "admin-approval-detail-back-queue",
  },
  { href: "/admin/users", labelKey: "admin_approvals_linkUsers" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];

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

export const APPROVAL_DETAIL_BASIC_ROW_DEFS: { key: string; labelKey: string }[] = [
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
];

export const APPROVAL_DETAIL_ADVANCED_ROW_DEFS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_approvals_colId" },
  { key: "before_payload", labelKey: "admin_approval_detail_beforePayload" },
  { key: "after_payload", labelKey: "admin_approval_detail_afterPayload" },
];

/** @deprecated use APPROVAL_DETAIL_BASIC_ROW_DEFS + APPROVAL_DETAIL_ADVANCED_ROW_DEFS */
export const APPROVAL_DETAIL_ROW_DEFS: { key: string; labelKey: string }[] = [
  ...APPROVAL_DETAIL_BASIC_ROW_DEFS,
  ...APPROVAL_DETAIL_ADVANCED_ROW_DEFS,
];
