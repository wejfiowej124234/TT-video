import { isUuidString } from "@/lib/isUuidString";

export type PolicyChangeLogRow = {
  id?: string;
  actor_id?: string | null;
  scope?: string;
  summary?: string | null;
  before_snapshot?: unknown;
  after_snapshot?: unknown;
  source?: string | null;
  created_at?: string;
};

export type PolicyChangeLogsRes = {
  status?: string;
  error?: string;
  items?: PolicyChangeLogRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const SCOPE_MAX = 128;
export const SUMMARY_MAX = 256;
export const SOURCE_MAX = 128;

export function snapPreview(v: unknown, dash: string): string {
  if (v == null) return dash;
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s.length > 64 ? `${s.slice(0, 64)}…` : s;
  } catch {
    return dash;
  }
}

export function parsePolicyLogsQuery(sp: URLSearchParams): {
  limit: number;
  scope: string;
  summary: string;
  source: string;
  actorId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const scope = (sp.get("scope") ?? "").trim().slice(0, SCOPE_MAX);
  const summary = (sp.get("summary") ?? "").trim().slice(0, SUMMARY_MAX);
  const source = (sp.get("source") ?? "").trim().slice(0, SOURCE_MAX);
  const rawA = (sp.get("actor_id") ?? "").trim();
  const actorId = isUuidString(rawA) ? rawA : "";
  return { limit, scope, summary, source, actorId };
}

export function buildPolicyLogsPath(q: {
  limit: number;
  scope: string;
  summary: string;
  source: string;
  actorId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const sc = q.scope.trim().slice(0, SCOPE_MAX);
  if (sc) sp.set("scope", sc);
  const su = q.summary.trim().slice(0, SUMMARY_MAX);
  if (su) sp.set("summary", su);
  const so = q.source.trim().slice(0, SOURCE_MAX);
  if (so) sp.set("source", so);
  if (q.actorId && isUuidString(q.actorId)) sp.set("actor_id", q.actorId.trim());
  return `/admin/community/policy-change-logs?${sp.toString()}`;
}
