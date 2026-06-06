/**
 * **DID 排行榜**（**30** §4；**`crates/api/src/routes/did_rank/`**；**04** 附录）。
 *
 * **`period`**：**`week` | `month` | `all`**（与路由 **`DidRankQuery`** 一致）。成功体根级含 **`rank_basis`**、**`travelers` | `guides` | `itineraries`**（见 **`did_rank_meta`**）。
 *
 * **与订单类 `chain_off_unavailable` 不同**：**无 PostgreSQL 且无 `chain_off`** 时仍 **200**，**`status: ok`**，对应列表为空数组，**`note`** 为 **P2/G1 占位**（**非** **503**）；有 **DB** 优先 SQL；否则 **`chain_off` 内存榜**回退。
 * 已登录（**`getAuthHeaders()`**）时项上可有 **`is_me`**。
 */

import type { GuideLeaderboardSort } from "../../didRankUtils";
import { apiUrl, routes } from "../../api";
import { requestId, logApiJsonStatusNotOk, getAuthHeaders, parseResponse, throwUnlessApiOk } from "../core";

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
