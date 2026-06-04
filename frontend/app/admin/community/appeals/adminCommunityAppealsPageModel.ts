import { isUuidString } from "@/lib/isUuidString";

export type CommunityAppealRow = {
  id?: string;
  report_id?: string;
  appellant_id?: string;
  body?: string;
  status?: string;
  reviewer_note?: string | null;
  version?: number;
  created_at?: string;
  reviewed_at?: string | null;
};

export type CommunityAppealsRes = {
  status?: string;
  error?: string;
  items?: CommunityAppealRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const APPEAL_STATUS = ["", "pending", "accepted", "rejected"] as const;
export const APPEAL_STATUS_URL = new Set(["pending", "accepted", "rejected"]);

export function bodyPreview(s: string | undefined, dash: string): string {
  const text = s?.trim() || "";
  if (!text) return dash;
  return text.length > 96 ? `${text.slice(0, 96)}…` : text;
}

export function parseAppealsListQuery(sp: URLSearchParams): {
  limit: number;
  reportId: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawR = (sp.get("report_id") ?? "").trim();
  const reportId = isUuidString(rawR) ? rawR : "";
  const rawSt = (sp.get("status") ?? "").trim();
  const status = APPEAL_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, reportId, status };
}

export function buildAppealsListPath(q: { limit: number; reportId: string; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.reportId && isUuidString(q.reportId)) sp.set("report_id", q.reportId.trim());
  if (APPEAL_STATUS_URL.has(q.status)) sp.set("status", q.status);
  return `/admin/community/appeals?${sp.toString()}`;
}
