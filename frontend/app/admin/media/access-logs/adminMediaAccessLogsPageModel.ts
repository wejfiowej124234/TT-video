import { isUuidString } from "@/lib/isUuidString";

export type MediaAccessLogRow = {
  id?: string;
  token_id?: string | null;
  object_id?: string;
  actor_or_ip?: string;
  action?: string;
  occurred_at?: string;
};

export type MediaAccessLogsRes = {
  status?: string;
  error?: string;
  items?: MediaAccessLogRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const MEDIA_ACCESS_LOGS_OBJECT_MAX = 256;
export const MEDIA_ACCESS_LOGS_ACTOR_MAX = 256;
export const MEDIA_ACCESS_LOGS_ACTION_MAX = 64;

export function isValidMediaActionSegment(s: string): boolean {
  if (!s) return true;
  return s.length <= MEDIA_ACCESS_LOGS_ACTION_MAX && /^[A-Za-z0-9_]+$/.test(s);
}

export function parseMediaAccessLogsQuery(sp: URLSearchParams): {
  limit: number;
  action: string;
  objectId: string;
  actorOrIp: string;
  tokenId: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawAction = (sp.get("action") ?? "").trim().slice(0, MEDIA_ACCESS_LOGS_ACTION_MAX);
  const action = isValidMediaActionSegment(rawAction) ? rawAction : "";
  const objectId = (sp.get("object_id") ?? "").trim().slice(0, MEDIA_ACCESS_LOGS_OBJECT_MAX);
  const actorOrIp = (sp.get("actor_or_ip") ?? "").trim().slice(0, MEDIA_ACCESS_LOGS_ACTOR_MAX);
  const rawTok = (sp.get("token_id") ?? "").trim();
  const tokenId = isUuidString(rawTok) ? rawTok : "";
  return { limit, action, objectId, actorOrIp, tokenId };
}

export function buildMediaAccessLogsListPath(q: {
  limit: number;
  action: string;
  objectId: string;
  actorOrIp: string;
  tokenId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const ac = q.action.trim().slice(0, MEDIA_ACCESS_LOGS_ACTION_MAX);
  if (ac && isValidMediaActionSegment(ac)) sp.set("action", ac);
  const oid = q.objectId.trim().slice(0, MEDIA_ACCESS_LOGS_OBJECT_MAX);
  if (oid) sp.set("object_id", oid);
  const act = q.actorOrIp.trim().slice(0, MEDIA_ACCESS_LOGS_ACTOR_MAX);
  if (act) sp.set("actor_or_ip", act);
  if (q.tokenId && isUuidString(q.tokenId)) sp.set("token_id", q.tokenId.trim());
  return `/admin/media/access-logs?${sp.toString()}`;
}
