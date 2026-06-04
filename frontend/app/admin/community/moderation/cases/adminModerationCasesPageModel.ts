import { isUuidString } from "@/lib/isUuidString";

export const ADMIN_MOD_CASES_STATUS_BEFORE_MAX = 64;
export const ADMIN_MOD_CASES_STATUS_AFTER_MAX = 64;

export type AdminModerationCasesListQuery = {
  limit: number;
  reportId: string;
  actorId: string;
  statusBefore: string;
  statusAfter: string;
};

export function truncAdminModCaseText(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function parseModerationCasesQuery(sp: URLSearchParams): AdminModerationCasesListQuery {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawA = (sp.get("actor_id") ?? "").trim();
  const actorId = isUuidString(rawA) ? rawA : "";
  const statusBefore = (sp.get("status_before") ?? "")
    .trim()
    .slice(0, ADMIN_MOD_CASES_STATUS_BEFORE_MAX);
  const statusAfter = (sp.get("status_after") ?? "")
    .trim()
    .slice(0, ADMIN_MOD_CASES_STATUS_AFTER_MAX);
  return { limit, reportId, actorId, statusBefore, statusAfter };
}

export function buildModerationCasesPath(q: AdminModerationCasesListQuery): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (q.actorId && isUuidString(q.actorId)) sp.set("actor_id", q.actorId.trim());
  const sb = q.statusBefore.trim().slice(0, ADMIN_MOD_CASES_STATUS_BEFORE_MAX);
  if (sb) sp.set("status_before", sb);
  const sa = q.statusAfter.trim().slice(0, ADMIN_MOD_CASES_STATUS_AFTER_MAX);
  if (sa) sp.set("status_after", sa);
  return `/admin/community/moderation/cases?${sp.toString()}`;
}
