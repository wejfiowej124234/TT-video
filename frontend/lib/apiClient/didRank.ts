/**
 * DID 排行榜 API（30 §4）；`period` 与后端 `routes/did_rank` 一致：week|month|all（近 7/30 天或全量）。
 * 成功响应根级含 `rank_basis`（排序口径机器键，见 docs/spec/04-附录-did-rank对接说明.md）。
 * 列表项在已登录（Bearer / 会话）时可含 `is_me`（与当前用户比对）；GET 须带 `getAuthHeaders()` 才有意义。
 */

import type { GuideLeaderboardSort } from "../didRankUtils";
import { apiUrl, routes } from "../api";
import { requestId, logApiJsonStatusNotOk, getAuthHeaders, parseResponse, throwUnlessApiOk } from "./core";

function periodQuery(period: string): string {
  const p = period.trim().toLowerCase();
  const safe = p === "week" || p === "month" || p === "all" ? p : "all";
  return `period=${encodeURIComponent(safe)}`;
}

function didRankGuidesQuery(period: string, sort?: GuideLeaderboardSort): string {
  const q = periodQuery(period);
  if (sort === "reviews") return `${q}&sort=reviews`;
  if (sort === "weighted") return `${q}&sort=weighted`;
  return q;
}

export type DidRankFetchOpts = { signal?: AbortSignal };

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as { name?: string }).name;
  return name === "AbortError";
}

/** 与 `getMeta` 同口径：408/429/502/503 与网络 flake 退避重试；支持 AbortSignal 取消。 */
async function fetchDidRankJson(
  url: string,
  label: string,
  opts?: DidRankFetchOpts,
): Promise<unknown> {
  const headers = { "x-request-id": requestId(), ...getAuthHeaders() };
  let last: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: opts?.signal });
      if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!res.ok && [408, 429, 502, 503].includes(res.status) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      const data = await parseResponse(res);
      logApiJsonStatusNotOk(label, data);
      throwUnlessApiOk(data);
      return data;
    } catch (e) {
      if (isAbortError(e) || opts?.signal?.aborted) throw e;
      last = e;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
    }
  }
  throw last;
}

export async function getDidRankTravelers(
  period: "week" | "month" | "all",
  opts?: DidRankFetchOpts,
): Promise<unknown> {
  const url = `${apiUrl(routes.didRankTravelers)}?${periodQuery(period)}`;
  return fetchDidRankJson(url, "getDidRankTravelers", opts);
}

export async function getDidRankGuides(
  period: "week" | "month" | "all",
  sort: GuideLeaderboardSort = "weighted",
  opts?: DidRankFetchOpts,
): Promise<unknown> {
  const url = `${apiUrl(routes.didRankGuides)}?${didRankGuidesQuery(period, sort)}`;
  return fetchDidRankJson(url, "getDidRankGuides", opts);
}

export async function getDidRankItineraries(period: "week" | "month" | "all"): Promise<unknown> {
  const url = `${apiUrl(routes.didRankItineraries)}?${periodQuery(period)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankItineraries", data);
  throwUnlessApiOk(data);
  return data;
}

/** 商家榜 · `GET /api/v1/did-rank/providers`（① MVP：published listings；无 DB 时空列表+note） */
export async function getDidRankProviders(period: "week" | "month" | "all"): Promise<unknown> {
  const url = `${apiUrl(routes.didRankProviders)}?${periodQuery(period)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankProviders", data);
  throwUnlessApiOk(data);
  return data;
}

/** 旅行收购榜 · `GET /api/v1/did-rank/acquisitions`（① MVP：published listings；无 DB 时空列表+note） */
export async function getDidRankAcquisitions(period: "week" | "month" | "all"): Promise<unknown> {
  const url = `${apiUrl(routes.didRankAcquisitions)}?${periodQuery(period)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankAcquisitions", data);
  throwUnlessApiOk(data);
  return data;
}
