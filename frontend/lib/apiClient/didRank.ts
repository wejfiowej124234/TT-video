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

export async function getDidRankTravelers(period: "week" | "month" | "all"): Promise<unknown> {
  const url = `${apiUrl(routes.didRankTravelers)}?${periodQuery(period)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankTravelers", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getDidRankGuides(
  period: "week" | "month" | "all",
  sort: GuideLeaderboardSort = "weighted",
): Promise<unknown> {
  const url = `${apiUrl(routes.didRankGuides)}?${didRankGuidesQuery(period, sort)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankGuides", data);
  throwUnlessApiOk(data);
  return data;
}

export async function getDidRankItineraries(period: "week" | "month" | "all"): Promise<unknown> {
  const url = `${apiUrl(routes.didRankItineraries)}?${periodQuery(period)}`;
  const res = await fetch(url, { headers: { "x-request-id": requestId(), ...getAuthHeaders() } });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("getDidRankItineraries", data);
  throwUnlessApiOk(data);
  return data;
}
