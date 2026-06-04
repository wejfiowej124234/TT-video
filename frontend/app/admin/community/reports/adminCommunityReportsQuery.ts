import { isUuidString } from "@/lib/isUuidString";
import {
  RC_MAX,
  STATUS_URL,
  TT_MAX,
  type ReportsListParsed,
} from "./adminCommunityReportsTypes";

export function parseReportsListQuery(sp: URLSearchParams): ReportsListParsed {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawSt = (sp.get("status") ?? "").trim();
  const status = STATUS_URL.has(rawSt) ? rawSt : "";
  const rep = (sp.get("reporter_id") ?? "").trim();
  const reporterId = isUuidString(rep) ? rep : "";
  const targetType = (sp.get("target_type") ?? "").trim().slice(0, TT_MAX);
  const reasonCode = (sp.get("reason_code") ?? "").trim().slice(0, RC_MAX);
  const tid = (sp.get("target_id") ?? "").trim();
  const targetId = isUuidString(tid) ? tid : "";
  return { limit, status, reporterId, targetType, reasonCode, targetId };
}

export function buildReportsListPath(q: ReportsListParsed): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (STATUS_URL.has(q.status)) sp.set("status", q.status);
  if (q.reporterId && isUuidString(q.reporterId)) sp.set("reporter_id", q.reporterId.trim());
  const tt = q.targetType.trim().slice(0, TT_MAX);
  if (tt) sp.set("target_type", tt);
  const rc = q.reasonCode.trim().slice(0, RC_MAX);
  if (rc) sp.set("reason_code", rc);
  if (q.targetId && isUuidString(q.targetId)) sp.set("target_id", q.targetId.trim());
  return `/admin/community/reports?${sp.toString()}`;
}
