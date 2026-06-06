import {
  getAuthHeaders,
  requestId,
  logApiJsonStatusNotOk,
  parseResponse,
  throwUnlessApiOk,
  retryAfterSecondsFrom429Response,
  fetchGetWithTransitRetry,
} from "../core";
import { isExpectedCommunityWriteRejection } from "@/lib/communityApiExpectedWriteRejection";

function logCommunityWriteJsonStatus(context: string, data: unknown): void {
  if (isExpectedCommunityWriteRejection(data)) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.debug(`${context} expected write rejection:`, data);
    }
    return;
  }
  logApiJsonStatusNotOk(context, data);
}

export const defaultHeaders = (): Record<string, string> => ({
  "x-request-id": requestId(),
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

/** 社区 GET：408/429/502/503/504 与网络 flake 退避重试（② staging P1）。 */
export async function communityFetchGet(url: string, init?: RequestInit): Promise<Response> {
  return fetchGetWithTransitRetry(url, { headers: defaultHeaders(), ...init }, { attempts: 4 });
}

/** 将 **`Retry-After`** 并入 JSON，供 **`interpretCommunityWriteError`** 与 **04** §3.3 反刷文案对拍（**`communityJsonBody`** 路径不抛错时仍可读头）。 */
export function merge429RetryAfterFromResponse(res: Response, data: unknown): unknown {
  const sec = retryAfterSecondsFrom429Response(res);
  if (sec == null) return data;
  if (data == null || typeof data !== "object") {
    if (res.ok) return data;
    return { status: "error", message: `http_${res.status}`, error: `http_${res.status}`, retry_after_sec: sec };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.retry_after_sec === "number" && Number.isFinite(o.retry_after_sec)) return data;
  return { ...o, retry_after_sec: sec };
}

/** GET 等：与主站 apiClient 一致，HTTP 2xx 且根级 envelope `status !== "ok"` 时抛错，便于 `.catch` + `mapApiReadError` */
export async function communityReadOk(context: string, res: Response): Promise<unknown> {
  const data = await parseResponse(res);
  logApiJsonStatusNotOk(context, data);
  throwUnlessApiOk(data);
  return data;
}

/** POST 等：无论 HTTP 是否 2xx 都解析 JSON，便于读取 `status`/`message` */
export async function communityJsonBody(context: string, res: Response): Promise<unknown | null> {
  const data: unknown = await res.json().catch(() => null);
  logCommunityWriteJsonStatus(context, data);
  return data;
}

/** 社区 **`POST`/`DELETE`** 等写路径：解析 JSON 后并入 **HTTP 429** 的 **`Retry-After`**（①②③ 与 **`posts.rs`** 反刷响应同源）。 */
export async function communityWriteJsonBody(context: string, res: Response): Promise<unknown | null> {
  const data = await communityJsonBody(context, res);
  return merge429RetryAfterFromResponse(res, data);
}
