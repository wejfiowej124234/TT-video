import {
  BINDING_ROLE_MAX,
  POLICY_CODE_MAX,
  POLICY_STATUS_URL,
  SCOPE_TYPE_MAX,
} from "./adminPoliciesPageConstants";

export function parsePoliciesListQuery(sp: URLSearchParams): {
  limit: number;
  policyCode: string;
  status: string;
  scopeType: string;
  bindingRole: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const policyCode = (sp.get("policy_code") ?? "").trim().slice(0, POLICY_CODE_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status: string = POLICY_STATUS_URL.has(rawSt) ? rawSt : "";
  const scopeType = (sp.get("scope_type") ?? "").trim().slice(0, SCOPE_TYPE_MAX);
  const bindingRole = (sp.get("binding_role") ?? "").trim().slice(0, BINDING_ROLE_MAX);
  return { limit, policyCode, status, scopeType, bindingRole };
}

export function buildPoliciesListPath(q: {
  limit: number;
  policyCode: string;
  status: string;
  scopeType: string;
  bindingRole: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const pc = q.policyCode.trim().slice(0, POLICY_CODE_MAX);
  if (pc) sp.set("policy_code", pc);
  if (q.status === "draft" || q.status === "active" || q.status === "deprecated") {
    sp.set("status", q.status);
  }
  const st = q.scopeType.trim().slice(0, SCOPE_TYPE_MAX);
  if (st) sp.set("scope_type", st);
  const br = q.bindingRole.trim().slice(0, BINDING_ROLE_MAX);
  if (br) sp.set("binding_role", br);
  return `/admin/policies?${sp.toString()}`;
}
