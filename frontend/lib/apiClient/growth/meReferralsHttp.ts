import { apiUrl, routes } from "../../api";
import { getAuthHeaders, parseResponse, requestId, writeRequestHeaders, logApiJsonStatusNotOk } from "../core";

export type MeReferralBinding = {
  is_referred: boolean;
  referred_at?: string | null;
};

export type MeReferralStats = {
  referrals_total: number;
  referrals_register: number;
  growth_points: number;
  growth_fraud_status: string;
};

export type MeEarlyBirdSummary = {
  registration_rank?: number | null;
  stage_number?: number | null;
  multiplier: number;
};

export type MeReferralEventSummary = {
  id: string;
  event_type: string;
  points_for_me: number;
  created_at: string;
};

export type MeGrowthLedgerSummaryRow = {
  id: string;
  source: string;
  points: number;
  base_points?: number | null;
  early_bird_multiplier?: number | null;
  early_bird_stage?: number | null;
  created_at?: string;
};

export type MeReferralsSummary = {
  referral_code: string;
  referral_link_path: string;
  binding: MeReferralBinding;
  stats: MeReferralStats;
  early_bird: MeEarlyBirdSummary;
  recent_referral_events: MeReferralEventSummary[];
  recent_ledger: MeGrowthLedgerSummaryRow[];
};

export async function getMeReferrals(params?: {
  events_limit?: number;
  ledger_limit?: number;
}): Promise<{ referrals?: MeReferralsSummary }> {
  const q = new URLSearchParams();
  if (params?.events_limit != null) q.set("events_limit", String(params.events_limit));
  if (params?.ledger_limit != null) q.set("ledger_limit", String(params.ledger_limit));
  const suffix = q.toString() ? `?${q}` : "";
  const res = await fetch(apiUrl(`${routes.meReferrals}${suffix}`), {
    headers: {
      ...writeRequestHeaders(),
      ...getAuthHeaders(),
      "x-request-id": requestId(),
    },
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getMeReferrals", data);
  return data as { referrals?: MeReferralsSummary };
}
