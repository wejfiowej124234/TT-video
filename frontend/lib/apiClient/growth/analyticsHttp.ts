import { apiUrl, routes } from "../../api";
import { parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type GrowthAnalyticsWindow = {
  from?: string | null;
  to?: string | null;
};

export type FraudStatusBreakdownRow = {
  growth_fraud_status: string;
  user_count: number;
};

export type EarlyBirdDistributionRow = {
  early_bird_stage?: number | null;
  user_count: number;
  points_sum: number;
};

export type AirdropAnalyticsSummary = {
  campaign_count: number;
  snapshot_locked_count: number;
  calculated_count: number;
  total_snapshot_rows: number;
  total_eligible_rows: number;
  latest_campaign_name?: string | null;
  latest_campaign_status?: string | null;
};

export type GrowthAnalyticsOverview = {
  window: GrowthAnalyticsWindow;
  registrations_total: number;
  registrations_with_referral: number;
  referral_events_total: number;
  users_with_points: number;
  total_growth_points: number;
  referral_code_active_count: number;
  referral_code_conversion_uses: number;
  fraud_breakdown: FraudStatusBreakdownRow[];
  frozen_or_ineligible_count: number;
  frozen_or_ineligible_pct: number;
  early_bird_distribution: EarlyBirdDistributionRow[];
  airdrop: AirdropAnalyticsSummary;
};

export type RegistrationFunnelStep = {
  step: string;
  count: number;
  rate_from_start_pct: number;
  rate_from_previous_pct?: number | null;
};

export type GrowthAnalyticsFunnel = {
  window: GrowthAnalyticsWindow;
  steps: RegistrationFunnelStep[];
};

export type TopReferrerRow = {
  user_id: string;
  email?: string | null;
  referral_code?: string | null;
  invite_count: number;
  points_awarded_referrer: number;
  growth_points: number;
  growth_fraud_status: string;
};

export type KolContributionRow = {
  id: string;
  code: string;
  label?: string | null;
  owner_user_id?: string | null;
  owner_email?: string | null;
  use_count: number;
  max_uses?: number | null;
  is_active: boolean;
  invite_count: number;
  points_awarded: number;
};

export type KolInviteEventRow = {
  referred_user_id: string;
  points_awarded_referrer: number;
  points_awarded_referred: number;
  created_at: string;
};

export type KolContributionDetail = {
  item: KolContributionRow;
  recent_invites: KolInviteEventRow[];
};

export type GrowthAnalyticsQuery = {
  days?: number;
  from?: string;
  to?: string;
  limit?: number;
};

function adminHeaders() {
  return { ...writeRequestHeaders(), "x-request-id": requestId() };
}

function queryString(q?: GrowthAnalyticsQuery): string {
  if (!q) return "";
  const params = new URLSearchParams();
  if (q.days != null) params.set("days", String(q.days));
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.limit != null) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getAdminGrowthAnalyticsOverview(
  q?: GrowthAnalyticsQuery,
): Promise<{ summary?: GrowthAnalyticsOverview }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAnalyticsOverview}${queryString(q)}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthAnalyticsOverview", data);
  return data as { summary?: GrowthAnalyticsOverview };
}

export async function getAdminGrowthAnalyticsFunnel(
  q?: GrowthAnalyticsQuery,
): Promise<{ funnel?: GrowthAnalyticsFunnel }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAnalyticsFunnel}${queryString(q)}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthAnalyticsFunnel", data);
  return data as { funnel?: GrowthAnalyticsFunnel };
}

export async function getAdminGrowthAnalyticsTopReferrers(
  q?: GrowthAnalyticsQuery,
): Promise<{ items?: TopReferrerRow[] }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthAnalyticsTopReferrers}${queryString(q)}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthAnalyticsTopReferrers", data);
  return data as { items?: TopReferrerRow[] };
}

export async function getAdminGrowthKolCenter(
  q?: GrowthAnalyticsQuery,
): Promise<{ items?: KolContributionRow[] }> {
  const res = await fetch(apiUrl(`${routes.adminGrowthKolCenter}${queryString(q)}`), {
    headers: adminHeaders(),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthKolCenter", data);
  return data as { items?: KolContributionRow[] };
}

export async function getAdminGrowthKolCenterDetail(
  codeId: string,
  q?: GrowthAnalyticsQuery,
): Promise<{ detail?: KolContributionDetail }> {
  const res = await fetch(
    apiUrl(`${routes.adminGrowthKolCenter}/${codeId}${queryString(q)}`),
    { headers: adminHeaders() },
  );
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getAdminGrowthKolCenterDetail", data);
  return data as { detail?: KolContributionDetail };
}
