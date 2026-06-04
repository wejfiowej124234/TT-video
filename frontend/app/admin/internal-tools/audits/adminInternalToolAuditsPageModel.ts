export type InternalToolAuditRow = {
  id?: string;
  tool_id?: string;
  tool_name?: string | null;
  action_code?: string;
  actor_id?: string;
  approval_request_id?: string | null;
  resource_ref?: string | null;
  input_digest?: string | null;
  result_digest?: string | null;
  created_at?: string;
};

export type InternalToolAuditsListRes = {
  status?: string;
  error?: string;
  items?: InternalToolAuditRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const TOOL_AUDITS_TOOL_ID_MAX = 128;
export const TOOL_AUDITS_ACTION_MAX = 128;
export const TOOL_AUDITS_ACTOR_MAX = 256;

export function truncToolAuditField(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function parseToolAuditsListQuery(
  sp: URLSearchParams,
  isUuid: (s: string) => boolean,
): {
  limit: number;
  toolId: string;
  actionCode: string;
  actorId: string;
  approvalRequestId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const toolId = (sp.get("tool_id") ?? "").trim().slice(0, TOOL_AUDITS_TOOL_ID_MAX);
  const actionCode = (sp.get("action_code") ?? "").trim().slice(0, TOOL_AUDITS_ACTION_MAX);
  const actorId = (sp.get("actor_id") ?? "").trim().slice(0, TOOL_AUDITS_ACTOR_MAX);
  const rawAp = (sp.get("approval_request_id") ?? "").trim();
  const approvalRequestId = isUuid(rawAp) ? rawAp : "";
  return { limit, toolId, actionCode, actorId, approvalRequestId };
}

export function buildToolAuditsListPath(
  q: {
    limit: number;
    toolId: string;
    actionCode: string;
    actorId: string;
    approvalRequestId: string;
  },
  isUuid: (s: string) => boolean,
): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const tid = q.toolId.trim().slice(0, TOOL_AUDITS_TOOL_ID_MAX);
  if (tid) sp.set("tool_id", tid);
  const ac = q.actionCode.trim().slice(0, TOOL_AUDITS_ACTION_MAX);
  if (ac) sp.set("action_code", ac);
  const aid = q.actorId.trim().slice(0, TOOL_AUDITS_ACTOR_MAX);
  if (aid) sp.set("actor_id", aid);
  if (q.approvalRequestId && isUuid(q.approvalRequestId)) {
    sp.set("approval_request_id", q.approvalRequestId.trim());
  }
  return `/admin/internal-tools/audits?${sp.toString()}`;
}
