import { apiUrl, routes } from "../api";
import { requestId, logApiJsonStatusNotOk, parseResponse, throwUnlessApiOk } from "./core";

export type DidRankPrizePoolResponse = {
  monthly_amount: number;
  currency: string;
  illustrative: boolean;
  source?: string;
  note?: string;
};

export async function getDidRankPrizePool(): Promise<DidRankPrizePoolResponse | null> {
  const url = apiUrl(routes.didRankPrizePool);
  const res = await fetch(url, { headers: { "x-request-id": requestId() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankPrizePool", data);
  throwUnlessApiOk(data);
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const amount = o.monthly_amount ?? o.monthlyAmount;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const illustrative = o.illustrative === true || o.source !== "env";
  return {
    monthly_amount: Math.max(0, Math.round(amount)),
    currency: typeof o.currency === "string" ? o.currency : "TTG",
    illustrative,
    source: typeof o.source === "string" ? o.source : undefined,
    note: typeof o.note === "string" ? o.note : undefined,
  };
}
