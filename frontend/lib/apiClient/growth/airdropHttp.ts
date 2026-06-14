import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type AirdropCampaignRow = {
  id: string;
  name: string;
  gov_pool_amount: number;
  status: string;
  snapshot_at?: string | null;
  network_points_total?: number | null;
  snapshot_user_count?: number | null;
  eligible_points_total?: number | null;
  calculation_version?: number;
  created_at?: string;
};

export type AirdropReconcileSummary = {
  campaign_id: string;
  status: string;
  snapshot_rows: number;
  eligible_rows: number;
  allocation_rows: number;
  snapshot_points_sum: number;
  eligible_points_sum: number;
  allocation_points_sum: number;
  gov_pool_amount: string;
  allocation_gov_sum: string;
  drift_points: number;
  drift_eligible: number;
};

export type AirdropExportRow = {
  user_id: string;
  points_at_snapshot: number;
  referral_invites: number;
  referral_points_awarded: number;
  early_bird_stage?: number | null;
  early_bird_multiplier?: number | null;
  growth_fraud_status: string;
  eligible: boolean;
  calculated_points?: number | null;
  notional_gov_amount?: string | null;
  allocation_status?: string | null;
};

function adminHeaders(json = false) {
  const h: Record<string, string> = { ...writeRequestHeaders(), "x-request-id": requestId() };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

export async function getAdminAirdropCampaigns(): Promise<{ items?: AirdropCampaignRow[] }> {
  const res = await fetch(apiUrl(routes.adminGrowthAirdropCampaigns), { headers: adminHeaders() });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminAirdropCampaigns", data);
  return data as { items?: AirdropCampaignRow[] };
}

export async function postAdminAirdropCampaign(body: {
  name: string;
  gov_pool_amount: number;
}): Promise<{ item?: AirdropCampaignRow }> {
  const res = await fetch(apiUrl(routes.adminGrowthAirdropCampaigns), {
    method: "POST",
    headers: adminHeaders(true),
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminAirdropCampaign", data);
  return data as { item?: AirdropCampaignRow };
}

export async function postAdminAirdropSnapshot(
  campaignId: string,
): Promise<{ item?: AirdropCampaignRow }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAirdropCampaigns}/${campaignId}/snapshot`), {
    method: "POST",
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminAirdropSnapshot", data);
  return data as { item?: AirdropCampaignRow };
}

export async function postAdminAirdropCalculate(
  campaignId: string,
): Promise<{ item?: AirdropCampaignRow }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAirdropCampaigns}/${campaignId}/calculate`), {
    method: "POST",
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminAirdropCalculate", data);
  return data as { item?: AirdropCampaignRow };
}

export async function postAdminAirdropRecalculate(
  campaignId: string,
): Promise<{ item?: AirdropCampaignRow }> {
  const res = await fetch(
    apiUrl(`${routes.adminGrowthAirdropCampaigns}/${campaignId}/recalculate`),
    { method: "POST", headers: adminHeaders() },
  );
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postAdminAirdropRecalculate", data);
  return data as { item?: AirdropCampaignRow };
}

export async function getAdminAirdropReconcile(
  campaignId: string,
): Promise<{ summary?: AirdropReconcileSummary }> {
  const res = await fetch(
    apiUrl(`${routes.adminGrowthAirdropCampaigns}/${campaignId}/reconcile`),
    { headers: adminHeaders() },
  );
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminAirdropReconcile", data);
  return data as { summary?: AirdropReconcileSummary };
}

export async function getAdminAirdropExport(
  campaignId: string,
): Promise<{ items?: AirdropExportRow[]; disclaimer?: string }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAirdropCampaigns}/${campaignId}/export`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminAirdropExport", data);
  return data as { items?: AirdropExportRow[]; disclaimer?: string };
}

export function downloadAirdropExportCsv(campaignId: string, rows: AirdropExportRow[]): void {
  const header =
    "user_id,points_at_snapshot,referral_invites,referral_points_awarded,early_bird_stage,early_bird_multiplier,growth_fraud_status,eligible,calculated_points,notional_gov_amount,allocation_status";
  const lines = rows.map((r) =>
    [
      r.user_id,
      r.points_at_snapshot,
      r.referral_invites,
      r.referral_points_awarded,
      r.early_bird_stage ?? "",
      r.early_bird_multiplier ?? "",
      r.growth_fraud_status,
      r.eligible,
      r.calculated_points ?? "",
      r.notional_gov_amount ?? "",
      r.allocation_status ?? "",
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `airdrop-export-${campaignId.slice(0, 8)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
