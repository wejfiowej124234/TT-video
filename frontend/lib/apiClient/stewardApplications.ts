import { API_ROUTES } from "@/lib/api/routes";
import { getAuthHeaders, parseResponse } from "./core";

export type PostStewardApplicationBody = {
  jurisdictions: string[];
  legal_name: string;
  contact_email: string;
  wallet_address: string;
  motivation?: string;
};

export async function getMeStewardApplication(): Promise<unknown> {
  const res = await fetch(API_ROUTES.meStewardApplication, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return parseResponse(res);
}

export async function postStewardApplication(body: PostStewardApplicationBody): Promise<unknown> {
  const res = await fetch(API_ROUTES.stewardApplications, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function getStewardStakeQuote(jurisdictions: string[]): Promise<unknown> {
  const q = encodeURIComponent(jurisdictions.join(","));
  const res = await fetch(`${API_ROUTES.stewardStakeQuote}?jurisdictions=${q}`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse(res);
}

export type StewardStakeStatusResponse = {
  jurisdiction: string;
  wallet: string;
  has_jurisdiction_stake: boolean;
  min_stake_amount: string;
  pool_address: string;
  chain_id: number;
};

/** ② 链读 · 须 API 配置 CHAIN_RPC_URL + REGION_STEWARD_STAKE_POOL_ADDRESS */
export async function getStewardStakeStatus(
  jurisdiction: string,
  wallet: string,
): Promise<StewardStakeStatusResponse> {
  const j = encodeURIComponent(jurisdiction);
  const w = encodeURIComponent(wallet);
  const res = await fetch(`${API_ROUTES.stewardStakeStatus}?jurisdiction=${j}&wallet=${w}`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse(res) as Promise<StewardStakeStatusResponse>;
}
