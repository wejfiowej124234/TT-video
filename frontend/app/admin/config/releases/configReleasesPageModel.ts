export type ConfigReleaseRow = {
  id?: string;
  release_key?: string;
  version_label?: string;
  status?: string;
  effective_from?: string | null;
  rolled_back_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ConfigReleasesListRes = {
  status?: string;
  error?: string;
  items?: ConfigReleaseRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const RELEASE_KEY_MAX_LEN = 256;
export const STATUS_OPTIONS = ["draft", "published", "rolled_back"] as const;

export function parseConfigReleasesListQuery(sp: URLSearchParams): {
  limit: number;
  releaseKey: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const releaseKey = (sp.get("release_key") ?? "").trim().slice(0, RELEASE_KEY_MAX_LEN);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_OPTIONS.includes(rawSt as (typeof STATUS_OPTIONS)[number]) ? rawSt : "";
  return { limit, releaseKey, status };
}

export function buildConfigReleasesListPath(q: {
  limit: number;
  releaseKey: string;
  status: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const rk = q.releaseKey.trim().slice(0, RELEASE_KEY_MAX_LEN);
  if (rk) sp.set("release_key", rk);
  if (q.status) sp.set("status", q.status);
  return `/admin/config/releases?${sp.toString()}`;
}
