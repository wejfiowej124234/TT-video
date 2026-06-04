import type { AdminAuditDetailLinkField } from "@/lib/adminAuditLogsPath";

export type AdminAuditLogDetailRes = {
  status?: string;
  error?: string;
  audit_log?: Record<string, unknown>;
  meta?: unknown;
};

export function formatAuditLogDetailValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export const AUDIT_LOG_DETAIL_ROWS: { key: string; labelKey: string }[] = [
  { key: "id", labelKey: "admin_audit_detail_id" },
  { key: "action", labelKey: "admin_audit_list_colAction" },
  { key: "resource_type", labelKey: "admin_audit_list_resourceType" },
  { key: "resource_id", labelKey: "admin_audit_detail_resourceId" },
  { key: "actor_id", labelKey: "admin_audit_list_colActor" },
  { key: "request_id", labelKey: "admin_audit_list_colRequestId" },
  { key: "created_at", labelKey: "admin_audit_list_colCreated" },
  { key: "payload", labelKey: "admin_audit_list_colPayload" },
];

export function auditDetailLinkFieldForRowKey(key: string): AdminAuditDetailLinkField | null {
  return key === "action" || key === "actor_id" || key === "resource_type" ? key : null;
}
