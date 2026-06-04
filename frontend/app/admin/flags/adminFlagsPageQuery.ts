import {
  ADMIN_FLAG_CODE_MAX_LEN,
  ADMIN_FLAG_ENABLED_URL,
  ADMIN_FLAG_SCOPE_RE,
} from "./adminFlagsPageConstants";

export function adminFlagRegionPreview(r: unknown, dash: string): string {
  if (r == null) return dash;
  try {
    const s = typeof r === "string" ? r : JSON.stringify(r);
    return s.length > 48 ? `${s.slice(0, 48)}…` : s;
  } catch {
    return dash;
  }
}

export function adminFlagRegionToInitialString(r: unknown): string {
  if (r == null) return "";
  if (typeof r === "string") return r;
  try {
    return JSON.stringify(r);
  } catch {
    return "";
  }
}

export function parseAdminFlagsListQuery(sp: URLSearchParams): {
  limit: number;
  flagCode: string;
  enabled: string;
  scope: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "200", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 200;
  limit = Math.min(200, Math.floor(limit));
  const flagCode = (sp.get("flag_code") ?? "").trim().slice(0, ADMIN_FLAG_CODE_MAX_LEN);
  const rawEn = (sp.get("enabled") ?? "").trim().toLowerCase();
  const enabled = ADMIN_FLAG_ENABLED_URL.has(rawEn) ? rawEn : "";
  const rawScope = (sp.get("scope") ?? "").trim();
  const scope = ADMIN_FLAG_SCOPE_RE.test(rawScope) ? rawScope : "";
  return { limit, flagCode, enabled, scope };
}

export function buildAdminFlagsListPath(q: {
  limit: number;
  flagCode: string;
  enabled: string;
  scope: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const fc = q.flagCode.trim().slice(0, ADMIN_FLAG_CODE_MAX_LEN);
  if (fc) sp.set("flag_code", fc);
  if (q.enabled === "true" || q.enabled === "false") sp.set("enabled", q.enabled);
  if (q.scope) sp.set("scope", q.scope);
  return `/admin/flags?${sp.toString()}`;
}
