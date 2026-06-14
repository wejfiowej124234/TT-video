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
  position?: {
    amount?: string;
    staked_at?: number;
    release_requested_at?: number;
    released_amount?: string;
    active?: boolean;
  } | null;
  releasable_amount?: string | number | null;
  release_delay_seconds?: string | null;
  release_vest_seconds?: string | null;
};

/** Seat 生命周期；404/501 时返回空 seat（常见于 API 未重编译）。 */
export async function getMeStewardSeat(): Promise<unknown> {
  const res = await fetch(API_ROUTES.meStewardSeat, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  if (res.status === 404 || res.status === 501) {
    return {
      status: "ok",
      seat: null,
      meta: { implementation_status: "steward_seat_unavailable" },
    };
  }
  return parseResponse(res);
}

export async function postStewardResignNotice(): Promise<unknown> {
  const res = await fetch(API_ROUTES.stewardResignNotice, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return parseResponse(res);
}

export async function postStewardFinalizeResign(): Promise<unknown> {
  const res = await fetch(API_ROUTES.stewardFinalizeResign, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });
  return parseResponse(res);
}

let stewardStakeStatusApiChainOff = false;

/** ① 本地链未起 / RPC 不可达 / 池地址无代码时 API 503/502；UI 按 chain-off 降级，不抛错。 */
const STEWARD_STAKE_STATUS_CHAIN_OFF_ERRORS = new Set([
  "chain_not_configured",
  "stake_pool_not_configured",
  "chain_rpc_unavailable",
  "stake_pool_unavailable",
  "eth_call_failed",
]);

function isStewardStakeStatusChainOff(status: number, body: unknown): boolean {
  if (status !== 503 && status !== 502) return false;
  if (!body || typeof body !== "object") return status === 503;
  const err = (body as Record<string, unknown>).error;
  return typeof err === "string" && STEWARD_STAKE_STATUS_CHAIN_OFF_ERRORS.has(err);
}

/** ② 链读 · 须 API 配置 CHAIN_RPC_URL + REGION_STEWARD_STAKE_POOL_ADDRESS；链不可用时返回 null */
export async function getStewardStakeStatus(
  jurisdiction: string,
  wallet: string,
): Promise<StewardStakeStatusResponse | null> {
  if (stewardStakeStatusApiChainOff) return null;
  const j = encodeURIComponent(jurisdiction);
  const w = encodeURIComponent(wallet);
  const res = await fetch(`${API_ROUTES.stewardStakeStatus}?jurisdiction=${j}&wallet=${w}`, {
    method: "GET",
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (isStewardStakeStatusChainOff(res.status, body)) {
      stewardStakeStatusApiChainOff = true;
      return null;
    }
    const replay = new Response(text, { status: res.status, statusText: res.statusText });
    return parseResponse(replay) as Promise<StewardStakeStatusResponse>;
  }
  const replay = new Response(text, { status: res.status, statusText: res.statusText });
  return parseResponse(replay) as Promise<StewardStakeStatusResponse>;
}
