export type AdminSchedulerJobRow = {
  id?: string;
  job_code?: string;
  status?: string;
  trigger_source?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  error_summary?: string | null;
  created_at?: string;
};

export type AdminSchedulerJobsListRes = {
  status?: string;
  error?: string;
  items?: AdminSchedulerJobRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type AdminSchedulerJobRerunRes = { status?: string; error?: string };

export const JOB_CODE_MAX_LEN = 160;

export function sanitizeJobCodeInput(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, JOB_CODE_MAX_LEN);
}

export function parseSchedulerListQuery(sp: URLSearchParams): { limit: number; jobCode: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const jobCode = sanitizeJobCodeInput(sp.get("job_code") ?? "");
  return { limit, jobCode };
}

export function buildSchedulerListPath(q: { limit: number; jobCode: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const jc = sanitizeJobCodeInput(q.jobCode);
  if (jc) sp.set("job_code", jc);
  return `/admin/scheduler/jobs?${sp.toString()}`;
}

export function truncSchedulerCell(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
