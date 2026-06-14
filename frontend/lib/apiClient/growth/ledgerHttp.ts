import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type AdminGrowthLedgerRow = {
  id: string;
  user_id: string;
  source: string;
  points: number;
  base_points?: number | null;
  idempotency_key: string;
  fraud_status?: string;
  created_at?: string;
  related_user_id?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
};

export type GrowthReconcileRow = {
  user_id: string;
  cached_points: number;
  ledger_sum: number;
  drift: number;
};

export async function getAdminRewardLedger(params?: {
  user_id?: string;
  source?: string;
  fraud_status?: string;
  limit?: number;
}): Promise<{ items?: AdminGrowthLedgerRow[]; count?: number }> {
  const q = new URLSearchParams();
  if (params?.user_id?.trim()) q.set("user_id", params.user_id.trim());
  if (params?.source?.trim()) q.set("source", params.source.trim());
  if (params?.fraud_status?.trim()) q.set("fraud_status", params.fraud_status.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthRewardLedger}${suffix}`), {
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminRewardLedger", data);
  return data as { items?: AdminGrowthLedgerRow[]; count?: number };
}

export async function getAdminRewardLedgerReconcile(params?: {
  user_id?: string;
  limit?: number;
}): Promise<{ items?: GrowthReconcileRow[]; item?: GrowthReconcileRow; drift_count?: number }> {
  const q = new URLSearchParams();
  if (params?.user_id?.trim()) q.set("user_id", params.user_id.trim());
  if (params?.limit != null) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.adminGrowthRewardLedgerReconcile}${suffix}`), {
    headers: { ...writeRequestHeaders(), "x-request-id": requestId() },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminRewardLedgerReconcile", data);
  return data as {
    items?: GrowthReconcileRow[];
    item?: GrowthReconcileRow;
    drift_count?: number;
  };
}

export async function postAdminRewardLedgerReconcileFix(
  userId: string,
): Promise<{ item?: GrowthReconcileRow }> {
  const res = await fetch(apiUrl(routes.adminGrowthRewardLedgerReconcileFix), {
    method: "POST",
    headers: { ...writeRequestHeaders(), "Content-Type": "application/json", "x-request-id": requestId() },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminRewardLedgerReconcileFix", data);
  return data as { item?: GrowthReconcileRow };
}

export async function patchAdminRewardLedgerFraud(
  ledgerId: string,
  fraudStatus: string,
): Promise<{ ledger_id?: string }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthRewardLedger}/${ledgerId}`), {
    method: "PATCH",
    headers: { ...writeRequestHeaders(), "Content-Type": "application/json", "x-request-id": requestId() },
    body: JSON.stringify({ fraud_status: fraudStatus }),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("patchAdminRewardLedgerFraud", data);
  return data as { ledger_id?: string };
}
