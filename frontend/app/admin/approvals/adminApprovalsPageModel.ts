export type ApprovalItem = {
  id: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  requested_by?: string;
  approved_by?: string | null;
  status?: string;
  reason?: string | null;
  approve_reason?: string | null;
  created_at?: string;
  approved_at?: string | null;
};

export type ApprovalRes = {
  status?: string;
  items?: ApprovalItem[];
  note?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
  error?: string;
};

export function clampApprovalLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(200, Math.max(1, Math.floor(n)));
}

/** 无 `status` 键 → 默认 pending；`status=` 空 → 不按状态过滤（全量）。 */
export function parseApprovalsListQuery(sp: URLSearchParams): { limit: number; status: string | undefined } {
  const limit = clampApprovalLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  let status: string | undefined;
  if (!sp.has("status")) {
    status = "pending";
  } else {
    const s = (sp.get("status") ?? "").trim();
    status = s === "" ? undefined : s;
  }
  return { limit, status };
}

export function buildApprovalsListPath(
  q: { limit: number; status: string | undefined },
  search?: string,
): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampApprovalLimit(q.limit)));
  if (q.status === undefined) {
    sp.set("status", "");
  } else {
    sp.set("status", q.status);
  }
  const s = (search ?? "").trim();
  if (s) sp.set("q", s);
  return `/admin/approvals?${sp.toString()}`;
}

export function parseApprovalsSearchQuery(sp: URLSearchParams): string {
  return (sp.get("q") ?? "").trim();
}
