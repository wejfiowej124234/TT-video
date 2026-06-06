import { apiUrl, routes } from "../../api";
import { requestId, parseResponse, getAuthHeaders, logApiJsonStatusNotOk, fetchGetWithTransitRetry, clearClientAuthStorage } from "../core";
import {
  clearDevApiOfflineMeFetchBlocked,
  isDevApiOfflineMeFetchBlocked,
  isDevUpstreamMeUnavailableStatus,
  markDevApiOfflineMeFetchBlocked,
} from "./meFetchDevOffline";

type GetMeCacheEntry = { promise: Promise<unknown | null>; result?: unknown | null; at: number };
let getMeCache: GetMeCacheEntry | null = null;
const GET_ME_CACHE_MS = 60_000;
/** 全栈并行 E2E / CI 下偶发 >4s；过短会误判未登录并跳转登录页 */
const GET_ME_TIMEOUT_MS = 12_000;

/**
 * 是否跳过 `GET /me`：优先读 **`app/layout.tsx`** 注入的 **`window.__TT_PUBLIC_SKIP_ME_FETCH`**（与服务器当前 `.env.local` 一致），
 * 避免 Webpack 对 **`NEXT_PUBLIC_*`** 的旧缓存与 Playwright 全栈脚本刚改 `.env.local` 时不同步。
 */
function isNextPublicSkipMeFetchEnabled(): boolean {
  if (typeof window !== "undefined" && typeof (window as unknown as { __TT_PUBLIC_SKIP_ME_FETCH?: string }).__TT_PUBLIC_SKIP_ME_FETCH === "string") {
    return (window as unknown as { __TT_PUBLIC_SKIP_ME_FETCH: string }).__TT_PUBLIC_SKIP_ME_FETCH === "1";
  }
  return typeof process !== "undefined" && process.env.NEXT_PUBLIC_SKIP_ME_FETCH === "1";
}

/** 开发/E2E：`NEXT_PUBLIC_SKIP_ME_FETCH=1` 且非 **production** 构建时跳过 `GET /me`（与 `getMe`/`getMeFull` 同源）。 */
export function isMeFullFetchSkippedByDevEnv(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NODE_ENV === "production") return false;
  return isNextPublicSkipMeFetchEnabled();
}

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

/** `app/api/v1/me` 开发态 API 未起：401 + `x-tt-me-source: dev-api-offline`（PH1-FE-02） */
function isDevTraveltrustApiOfflineMeResponse(res: Response): boolean {
  if (typeof process === "undefined" || process.env.NODE_ENV !== "development") return false;
  if (res.headers.get("x-tt-me-source") === "dev-api-offline") return true;
  return isDevUpstreamMeUnavailableStatus(res.status);
}

function handleDevTraveltrustApiOfflineMe(): void {
  markDevApiOfflineMeFetchBlocked();
  clearClientAuthStorage();
  clearGetMeCache();
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.warn(
      "[getMe] traveltrust-api 未启动 (8080)，已清除本地登录缓存；本会话不再请求 /me。启动 API 后请重新登录。scripts\\start-api-with-seed.bat",
    );
  }
}

function noteDevMeFetchSuccess(): void {
  clearDevApiOfflineMeFetchBlocked();
}

export function getMe(): Promise<unknown | null> {
  if (isNextPublicSkipMeFetchEnabled()) return Promise.resolve(null);
  if (isDevApiOfflineMeFetchBlocked()) return Promise.resolve(null);
  const auth = getAuthHeaders();
  if (!auth["X-User-Id"] && !auth["Authorization"]) {
    return Promise.resolve(null);
  }
  const now = Date.now();
  if (getMeCache) {
    if (getMeCache.result !== undefined && now - getMeCache.at < GET_ME_CACHE_MS) return Promise.resolve(getMeCache.result);
    return getMeCache.promise;
  }
  const entry: GetMeCacheEntry = { promise: null as unknown as Promise<unknown | null>, result: undefined, at: now };
  entry.promise = (async (): Promise<unknown | null> => {
    try {
      const url = apiUrl(routes.me);
      const res = await fetchGetWithTransitRetry(
        url,
        { headers: { "x-request-id": requestId(), ...auth } },
        { attempts: 4 },
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
      if (isDevTraveltrustApiOfflineMeResponse(res)) {
        handleDevTraveltrustApiOfflineMe();
        entry.result = null;
        entry.at = Date.now();
        return null;
      }
      const result = res.status === 401 ? null : await parseResponse(res);
      if (result != null) {
        noteDevMeFetchSuccess();
        logApiJsonStatusNotOk("getMe", result);
      }
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

export type GetMeFullOptions = { force?: boolean };

/**
 * GET /api/v1/me（与 `getMe` 同源）。
 * - **401**：经 `parseResponse` 抛 `login_required`（或网关 JSON），供 `/guide`、`/pay` 等严格会话门。
 * - **`force`**：先 `clearGetMeCache()` 再请求；成功后将结果写回 `getMe` 内存缓存。
 * - **404**：与 `getMe` 一致视为无用户，返回 `null` 并缓存 `null`。
 */
export async function getMeFull(opts?: GetMeFullOptions): Promise<unknown | null> {
  if (isNextPublicSkipMeFetchEnabled()) return null;
  if (isDevApiOfflineMeFetchBlocked()) return null;
  if (opts?.force === true) clearGetMeCache();
  const auth = getAuthHeaders();
  if (!auth["X-User-Id"] && !auth["Authorization"]) {
    return null;
  }
  try {
    const url = apiUrl(routes.me);
    const res = await fetchGetWithTransitRetry(
      url,
      { headers: { "x-request-id": requestId(), ...auth } },
      { attempts: 4 },
    );
    if (res.status === 404) {
      const entry: GetMeCacheEntry = {
        promise: Promise.resolve(null),
        result: null,
        at: Date.now(),
      };
      getMeCache = entry;
      return null;
    }
    if (isDevTraveltrustApiOfflineMeResponse(res)) {
      handleDevTraveltrustApiOfflineMe();
      const entry: GetMeCacheEntry = {
        promise: Promise.resolve(null),
        result: null,
        at: Date.now(),
      };
      getMeCache = entry;
      return null;
    }
    if (!res.ok) {
      await parseResponse(res);
    }
    const result = await parseResponse(res);
    if (result != null) {
      noteDevMeFetchSuccess();
      logApiJsonStatusNotOk("getMeFull", result);
    }
    const now = Date.now();
    const entry: GetMeCacheEntry = {
      promise: Promise.resolve(result as unknown | null),
      result: result as unknown | null,
      at: now,
    };
    getMeCache = entry;
    return result;
  } catch (e) {
    getMeCache = null;
    throw e;
  }
}

/** 网络/HTML 网关等非「明确未登录」类失败；`getMeFull` catch 里用于降噪（如 onboarding 首屏） */
export function isMeFullRequestError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message;
  if (msg === "login_required" || msg === "invalid_credentials" || msg === "invalid_old_password") return false;
  if (e.name === "AbortError") return true;
  if (msg === "api_html_not_json" || msg === "api_invalid_json_body") return true;
  if (/network|failed to fetch|load failed|fetch/i.test(msg)) return true;
  return false;
}
