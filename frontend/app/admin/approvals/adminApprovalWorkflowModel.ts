import type { ApprovalItem } from "./adminApprovalsPageModel";

export type ApprovalTimelineStep = {
  id: string;
  kind: "requested" | "pending" | "approved" | "rejected" | "cancelled";
  at?: string;
  actor?: string;
  note?: string;
};

export function approvalActionLabelKey(action: string | undefined): string {
  const a = (action ?? "").trim();
  if (a === "admin.user.role.change") return "admin_approvals_action_user_role";
  if (a === "admin.console_role.change") return "admin_approvals_action_console_role";
  if (a === "catalog.entity.publish") return "admin_approvals_action_catalog_publish";
  if (a === "catalog.poi_image.publish") return "admin_approvals_action_catalog_poi_image_publish";
  if (a === "catalog.import.trigger") return "admin_approvals_action_catalog_import_trigger";
  if (a === "ops.official.account.publish") return "admin_approvals_action_official_account_publish";
  if (a === "ops.official.guide.publish") return "admin_approvals_action_official_guide_publish";
  if (a === "ops.itinerary_template.publish") return "admin_approvals_action_official_itinerary_template_publish";
  if (a === "ops.cold_start.deploy") return "admin_approvals_action_cold_start_deploy";
  return "admin_approvals_action_other";
}

export function approvalStatusLabelKey(status: string | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "pending") return "admin_approvals_optPending";
  if (s === "approved") return "admin_approvals_optApproved";
  if (s === "rejected") return "admin_approvals_optRejected";
  if (s === "cancelled") return "admin_approvals_optCancelled";
  return "admin_approvals_status_unknown";
}

export function filterApprovalsBySearch(items: ApprovalItem[], q: string): ApprovalItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const hay = [
      item.id,
      item.action,
      item.resource_type,
      item.resource_id,
      item.requested_by,
      item.approved_by,
      item.status,
      item.reason,
      item.approve_reason,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

export function formatApprovalAge(createdAt: string | undefined, nowMs = Date.now()): string {
  if (!createdAt?.trim()) return "";
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return "";
  const mins = Math.max(0, Math.floor((nowMs - t) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function buildApprovalTimeline(row: Record<string, unknown>): ApprovalTimelineStep[] {
  const status = String(row.status ?? "").trim().toLowerCase();
  const steps: ApprovalTimelineStep[] = [
    {
      id: "requested",
      kind: "requested",
      at: typeof row.created_at === "string" ? row.created_at : undefined,
      actor: typeof row.requested_by === "string" ? row.requested_by : undefined,
      note: typeof row.reason === "string" ? row.reason : undefined,
    },
  ];
  if (status === "pending") {
    steps.push({ id: "pending", kind: "pending" });
  } else if (status === "approved") {
    steps.push({
      id: "approved",
      kind: "approved",
      at: typeof row.approved_at === "string" ? row.approved_at : undefined,
      actor: typeof row.approved_by === "string" ? row.approved_by : undefined,
      note: typeof row.approve_reason === "string" ? row.approve_reason : undefined,
    });
  } else if (status === "rejected") {
    steps.push({
      id: "rejected",
      kind: "rejected",
      at: typeof row.approved_at === "string" ? row.approved_at : undefined,
      actor: typeof row.approved_by === "string" ? row.approved_by : undefined,
      note: typeof row.approve_reason === "string" ? row.approve_reason : undefined,
    });
  } else if (status === "cancelled") {
    steps.push({ id: "cancelled", kind: "cancelled" });
  }
  return steps;
}

