export type AdminApiVersionRow = {
  api_version?: string;
  status?: string;
  released_at?: string | null;
  deprecated_at?: string | null;
  sunset_at?: string | null;
  compat_window_days?: number | null;
  active_client_ratio_7d?: number | null;
  request_count_7d?: number | null;
  last_change_at?: string;
  last_change_by?: string;
};

export type AdminApiVersionsListRes = {
  status?: string;
  error?: string;
  items?: AdminApiVersionRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export const API_VER_SUB_MAX = 128;
export const API_STATUS_URL = new Set(["planned", "active", "deprecated", "sunset"]);

export function parseAdminApiVersionsListQuery(sp: URLSearchParams): {
  limit: number;
  apiVersion: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const apiVersion = (sp.get("api_version") ?? "").trim().slice(0, API_VER_SUB_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status: string = API_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, apiVersion, status };
}

export function buildAdminApiVersionsListPath(q: {
  limit: number;
  apiVersion: string;
  status: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const av = q.apiVersion.trim().slice(0, API_VER_SUB_MAX);
  if (av) sp.set("api_version", av);
  if (q.status === "planned" || q.status === "active" || q.status === "deprecated" || q.status === "sunset") {
    sp.set("status", q.status);
  }
  return `/admin/api-versions?${sp.toString()}`;
}
