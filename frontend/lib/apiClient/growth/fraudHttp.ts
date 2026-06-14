import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type GrowthFraudRuleRow = {
  id: string;
  signal_type: string;
  risk_level: string;
  description: string;
  action: string;
  source: string;
};

export type GrowthFraudSignalRow = {
  id: string;
  subject_user_id: string;
  signal_type: string;
  risk_level: string;
  payload?: Record<string, unknown>;
  created_at?: string;
};

export type GrowthFraudUserRow = {
  user_id: string;
  email?: string | null;
  referral_code?: string | null;
  growth_fraud_status: string;
  growth_points: number;
  signal_count: number;
};

export type GrowthFraudCaseRow = {
  id: string;
  subject_user_id: string;
  status: string;
  resolution?: string | null;
  created_at?: string;
  updated_at?: string;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

export async function getAdminGrowthFraudRules(): Promise<{ items?: GrowthFraudRuleRow[] }> {
  const res = await fetch(apiUrl(routes.adminGrowthAntiFraudRules), { headers: adminHeaders() });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthFraudRules", data);
  return data as { items?: GrowthFraudRuleRow[] };
}

export async function getAdminGrowthFraudSignals(params?: {
  subject_user_id?: string;
  risk_level?: string;
  limit?: number;
}): Promise<{ items?: GrowthFraudSignalRow[] }> {
  const q = new URLSearchParams();
  if (params?.subject_user_id?.trim()) q.set("subject_user_id", params.subject_user_id.trim());
  if (params?.risk_level?.trim()) q.set("risk_level", params.risk_level.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthAntiFraudSignals}${suffix}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthFraudSignals", data);
  return data as { items?: GrowthFraudSignalRow[] };
}

export async function getAdminGrowthFraudUsers(params?: {
  fraud_status?: string;
  limit?: number;
}): Promise<{ items?: GrowthFraudUserRow[] }> {
  const q = new URLSearchParams();
  if (params?.fraud_status?.trim()) q.set("fraud_status", params.fraud_status.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthAntiFraudUsers}${suffix}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthFraudUsers", data);
  return data as { items?: GrowthFraudUserRow[] };
}

export async function patchAdminGrowthFraudUser(
  userId: string,
  body: { growth_fraud_status: string; disable_referral_codes?: boolean },
): Promise<{ item?: GrowthFraudUserRow }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAntiFraudUsers}/${userId}`), {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminGrowthFraudUser", data);
  return data as { item?: GrowthFraudUserRow };
}

export type GrowthFraudScanRunRow = {
  id: string;
  subject_user_id: string;
  trigger: string;
  idempotency_key: string;
  outcome: string;
  rules_fired?: unknown[];
  context_snapshot?: Record<string, unknown>;
  created_at?: string;
};

export async function getAdminGrowthFraudScanRuns(params?: {
  subject_user_id?: string;
  limit?: number;
}): Promise<{ items?: GrowthFraudScanRunRow[] }> {
  const q = new URLSearchParams();
  if (params?.subject_user_id?.trim()) q.set("subject_user_id", params.subject_user_id.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthAntiFraudScanRuns}${suffix}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthFraudScanRuns", data);
  return data as { items?: GrowthFraudScanRunRow[] };
}
