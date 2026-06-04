import {
  REGION_MAX,
  TENANT_KEY_MAX,
  TENANT_SCOPE_CLASSES,
  TENANT_SCOPE_STATUSES,
} from "./adminTenantScopesPageConstants";

export function parseTenantScopesListQuery(sp: URLSearchParams): {
  limit: number;
  tenantKey: string;
  regionCode: string;
  status: string;
  scopeClass: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const tenantKey = (sp.get("tenant_key") ?? "").trim().slice(0, TENANT_KEY_MAX);
  const regionCode = (sp.get("region_code") ?? "").trim().slice(0, REGION_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = TENANT_SCOPE_STATUSES.has(rawSt) ? rawSt : "";
  const rawCl = (sp.get("scope_class") ?? "").trim().toLowerCase();
  const scopeClass = TENANT_SCOPE_CLASSES.has(rawCl) ? rawCl : "";
  return { limit, tenantKey, regionCode, status, scopeClass };
}

export function buildTenantScopesListPath(q: {
  limit: number;
  tenantKey: string;
  regionCode: string;
  status: string;
  scopeClass: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const tk = q.tenantKey.trim().slice(0, TENANT_KEY_MAX);
  if (tk) sp.set("tenant_key", tk);
  const rg = q.regionCode.trim().slice(0, REGION_MAX);
  if (rg) sp.set("region_code", rg);
  if (q.status) sp.set("status", q.status);
  if (q.scopeClass) sp.set("scope_class", q.scopeClass);
  return `/admin/tenants/scopes?${sp.toString()}`;
}
