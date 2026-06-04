export const JOB_STATUSES = ["", "pending", "running", "completed", "failed", "dead_letter", "cancelled"] as const;
export const JOB_STATUS_SET = new Set<string>([
  "pending",
  "running",
  "completed",
  "failed",
  "dead_letter",
  "cancelled",
]);

export type AdminJobRow = {
  id?: string;
  queue_name?: string;
  job_type?: string;
  status?: string;
  attempt_count?: number;
  max_attempts?: number;
  last_error?: string | null;
  payload_ref?: string | null;
  idempotency_key?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminJobsRes = {
  status?: string;
  error?: string;
  summary?: Record<string, number>;
  items?: AdminJobRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export function parseJobsListQuery(sp: URLSearchParams): { limit: number; status: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawSt = (sp.get("status") ?? "").trim();
  const status = JOB_STATUS_SET.has(rawSt) ? rawSt : "";
  return { limit, status };
}

export function buildJobsListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.status) sp.set("status", q.status);
  return `/admin/jobs?${sp.toString()}`;
}

export function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
