import { isUuidString } from "@/lib/isUuidString";

import { PENALTY_STATUS_URL } from "./adminCommunityPenaltiesPageConstants";

export function parsePenaltiesListQuery(sp: URLSearchParams): {
  limit: number;
  subjectUserId: string;
  reportId: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawS = (sp.get("subject_user_id") ?? "").trim();
  const subjectUserId = isUuidString(rawS) ? rawS : "";
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawSt = (sp.get("status") ?? "").trim();
  const status = PENALTY_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, subjectUserId, reportId, status };
}

export function buildPenaltiesListPath(q: {
  limit: number;
  subjectUserId: string;
  reportId: string;
  status: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.subjectUserId && isUuidString(q.subjectUserId)) sp.set("subject_user_id", q.subjectUserId.trim());
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (PENALTY_STATUS_URL.has(q.status)) sp.set("status", q.status);
  return `/admin/community/penalties?${sp.toString()}`;
}
