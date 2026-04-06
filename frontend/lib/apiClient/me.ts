/**
 * 个人中心 API：getMe（含缓存）、stats、putMe、putMePassword
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  getAuthHeaders,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

type GetMeCacheEntry = { promise: Promise<unknown | null>; result?: unknown | null; at: number };
let getMeCache: GetMeCacheEntry | null = null;
const GET_ME_CACHE_MS = 60_000;
const GET_ME_TIMEOUT_MS = 4_000; // 避免 404/慢响应拖慢切换页面（切换页面卡顿）
const SKIP_ME_FETCH = typeof process !== "undefined" && process.env.NEXT_PUBLIC_SKIP_ME_FETCH === "1";

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

export function getMe(): Promise<unknown | null> {
  if (SKIP_ME_FETCH) return Promise.resolve(null);
  const auth = getAuthHeaders();
  if (!auth["X-User-Id"] && !auth["Authorization"]) {
    return Promise.resolve(null);
  }
  const now = Date.now();
  if (getMeCache) {
    if (getMeCache.result !== undefined && now - getMeCache.at < GET_ME_CACHE_MS)
      return Promise.resolve(getMeCache.result);
    return getMeCache.promise;
  }
  const entry: GetMeCacheEntry = { promise: null as unknown as Promise<unknown | null>, result: undefined, at: now };
  entry.promise = (async (): Promise<unknown | null> => {
    try {
      const url = apiUrl(routes.me);
      const res = await fetchWithTimeout(
        url,
        { headers: { "x-request-id": requestId(), ...auth } },
        GET_ME_TIMEOUT_MS
      );
      if (res.status === 404) {
        if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
          console.warn(
            "[getMe] GET /api/v1/me 返回 404。请确认：① 后端 traveltrust-api 已启动；② 监听端口为 8080（或与 NEXT_PUBLIC_API_BASE_URL 一致）；③ 8080 未被其他程序占用。详见《测试账号与本地联调》§八。"
          );
        }
        entry.result = null;
        entry.at = Date.now();
        return null;
      }
      const result = res.status === 401 ? null : await parseResponse(res);
      if (result != null) logApiJsonStatusNotOk("getMe", result);
      entry.result = result;
      entry.at = Date.now();
      return result;
    } catch (e) {
      getMeCache = null;
      if (e instanceof Error && e.name === "AbortError" && typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn("[getMe] 请求超时，视为未登录。可重启后端 traveltrust-api 或检查端口。");
      }
      entry.result = null;
      entry.at = Date.now();
      return null;
    }
  })();
  getMeCache = entry;
  return entry.promise;
}

export function clearGetMeCache(): void {
  getMeCache = null;
}

export async function getMeStats(): Promise<{ status: string; stats?: Record<string, unknown> }> {
  const res = await fetch(apiUrl(routes.meStats), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const parsed = await parseResponse(res);
  logApiJsonStatusNotOk("getMeStats", parsed);
  throwUnlessApiOk(parsed);
  return parsed as { status: string; stats?: Record<string, unknown> };
}

export async function putMe(body: { nickname?: string; avatar_url?: string; default_wallet_address?: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.me), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("putMe", data);
  throwUnlessApiOk(data);
  return data;
}

export async function putMePassword(body: { old_password?: string; new_password?: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.mePassword), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("putMePassword", data);
  throwUnlessApiOk(data);
  return data;
}
