/**
 * **96-18 TTG 兑换报价**（`GET /api/v1/governance/ttg-exchange/quote`；与 **page-brief `liquidity_contract`** 同源）。
 * **①** 合同面：`implementation_status=ttg_exchange_quote_contract_only`；**②** 再接真链 Router/Treasury。
 */

import { apiUrl, routes } from "../../api";
import { apiFetch, logApiJsonStatusNotOk, parseResponse, requestId, throwUnlessApiOk } from "../core";
import type { TtgExchangePayStable, TtgExchangeQuoteResponse } from "./ttgExchange.types";

const fetch = apiFetch;

export async function getTtgExchangeQuote(
  payStable: TtgExchangePayStable = "USDC",
): Promise<TtgExchangeQuoteResponse> {
  const q = new URLSearchParams();
  q.set("pay_stable", payStable);
  const url = `${apiUrl(routes.governanceTtgExchangeQuote)}?${q}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId() } });
  const data = (await parseResponse(res)) as TtgExchangeQuoteResponse & { status?: string; error?: string };
  logApiJsonStatusNotOk("getTtgExchangeQuote", data as Record<string, unknown>);
  throwUnlessApiOk(data);
  return data;
}
