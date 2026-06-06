/**
 * Playwright **`APIRequestContext`** 限流退避：**429** / 体含 **`rate_limit`** / 社区 **`post_too_fast`** 等按
 * **`waitMsFromRateLimitResponse`**（真源 **`lib/apiClient/core` · `waitMsFromRateLimitHttpSnapshot`**）等待后重试；
 * 与 **`bilateralEscrowE2e`**、**①②③** **`parseResponse` · `attach429RetryAfterToError`** 语义对齐；
 * **`GET`/`PATCH`/`DELETE` · `*ExpectOkWith429Backoff`**：遇 **429** / 体限流时 **最多 `RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS` 次** 退避重试；
 * **`requestPostExpectOkWith429Backoff`**：读 **`text()`** 以检 **`HTTP 429`**、JSON 限流体、根级 **`status:"error"`** 信封；成功后以 **`Proxy`** 重写 **`json()`** · **`text()`**，避免额外 **`POST`**（幂等写仍建议 **`Idempotency-Key`**）。
 */
import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";

import { waitMsFromRateLimitResponse } from "./rateLimitBackoffMs";

/** 全栈 E2E 下 API 偶发 **`ECONNRESET`** / **`ECONNREFUSED`**（冷启争用、对端未就绪）/ **`EAI_AGAIN`** 等；**非**断言成功，仅重试同一请求。 */
function isTransientNetRequestError(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /ECONNRESET|ETIMEDOUT|EPIPE|ECONNREFUSED|EAI_AGAIN|socket hang up|NetworkError|Failed to fetch|UND_ERR_SOCKET|read ECONNRESET/i.test(
    msg,
  );
}

function parseTransientNetMaxAttempts(): number {
  const raw = (process.env.PLAYWRIGHT_TRANSIENT_NET_MAX_ATTEMPTS ?? "").trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(8, n);
}

const TRANSIENT_NET_MAX_ATTEMPTS = parseTransientNetMaxAttempts();

/** 与 **`smoke-nav`** 瞬断重试的 **600ms+** 线性档同数量级；API/Next 代理争用下避免过短连拍仍假红。 */
async function withTransientNetRetry<T>(run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < TRANSIENT_NET_MAX_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (e) {
      last = e;
      if (!isTransientNetRequestError(e) || attempt === TRANSIENT_NET_MAX_ATTEMPTS - 1) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw last;
}

/** 与 `playwright.config` 顶层 **`expect.timeout`** / **`actionTimeout`** 同档；调用方未传 **`timeout`** 时避免 Playwright **`request.*` 默认短超时**在冷 API / 全栈串跑下假红。 */
const DEFAULT_API_REQUEST_TIMEOUT_MS = 90_000;

/** 仅在 **`options.timeout`** 未设为有限 **`number`** 时补齐；显式值（含更短探针）原样保留。 */
function withDefaultApiRequestTimeout<T extends { timeout?: number } | undefined>(options: T): T {
  if (options !== undefined && options !== null && typeof options === "object" && "timeout" in options) {
    const t = (options as { timeout?: number }).timeout;
    if (typeof t === "number" && Number.isFinite(t)) return options;
  }
  if (options !== undefined && options !== null && typeof options === "object") {
    return { ...(options as object), timeout: DEFAULT_API_REQUEST_TIMEOUT_MS } as T;
  }
  return { timeout: DEFAULT_API_REQUEST_TIMEOUT_MS } as T;
}

/**
 * **429** / 体 **`rate_limit`** / 社区反刷 **`post_too_fast`** 等（与 **`community_abuse_reject`**、**`waitMsFromRateLimitHttpSnapshot`** 同源）。
 * **不含** **`post_duplicate_body`** / **`comment_duplicate`** / **`report_duplicate_target`** —— 退避重试同一载荷无益。
 */
function looksBackoffEligibleRateLimit(httpStatus: number, bodySnippet: string): boolean {
  const blob = `${httpStatus} ${bodySnippet}`;
  if (/429|rate_limit/i.test(blob)) return true;
  return /"(post_too_fast|post_rate_limited|comment_too_fast|comment_rate_limited|report_too_fast|report_rate_limited)"/i.test(
    bodySnippet,
  );
}

function parseJsonFromEnvelopeOrThrow(bodyUtf8: string): { status?: string } | null {
  try {
    const j = JSON.parse(bodyUtf8) as { status?: string };
    if (j && typeof j === "object" && !Array.isArray(j)) return j;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * 已为限流 **`text()`** 消费响应体：**`json()`**、**`text()`** 回读同源正文（其余委托原 **`APIResponse`**）。
 */
function apiResponseReuseConsumedText(target: APIResponse, consumedUtf8Text: string): APIResponse {
  return new Proxy(target, {
    get(t, prop, receiver) {
      if (prop === "json") {
        return (): Promise<unknown> => Promise.resolve(JSON.parse(consumedUtf8Text) as unknown);
      }
      if (prop === "text") {
        return (): Promise<string> => Promise.resolve(consumedUtf8Text);
      }
      const v = Reflect.get(t, prop, receiver);
      return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(t) : v;
    },
  }) as APIResponse;
}

function parseExpectOk429MaxAttempts(): number {
  const raw = (process.env.PLAYWRIGHT_RATE_LIMIT_BACKOFF_MAX_ATTEMPTS ?? "").trim();
  if (!raw) return 5;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 5;
  return Math.min(12, n);
}

/** **`POST` / `GET` / `PATCH` / `DELETE`**：`*ExpectOkWith429Backoff` 遇限流时的最大尝试次数；可用 **`PLAYWRIGHT_RATE_LIMIT_BACKOFF_MAX_ATTEMPTS`**（**1–12**，默认 **5**）与 **`EVIDENCE_MAX_REQUESTS_PER_MINUTE`** 全矩阵尾段对齐。 */
const RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS = parseExpectOk429MaxAttempts();

/**
 * **`POST`**：**HTTP 429** 时读体、退避、**重试一次**；其它非 **ok** 原样返回（**不**消费 body，便于 `skip` / `json`）。
 * 幂等写应固定 **`Idempotency-Key`**，重试与 **`bilateralEscrowE2e`** 一致。
 */
export async function requestPostWith429Retry(
  request: APIRequestContext,
  url: string,
  options: Parameters<APIRequestContext["post"]>[1] & object,
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options) as Parameters<APIRequestContext["post"]>[1] & object;
  let res = await withTransientNetRetry(() => request.post(url, opts));
  if (res.ok()) return res;
  if (res.status() !== 429) return res;
  const body1 = await res.text();
  const waitMs = waitMsFromRateLimitResponse(res.headers(), body1);
  await new Promise((r) => setTimeout(r, waitMs));
  return withTransientNetRetry(() => request.post(url, opts));
}

/**
 * **`GET`**：同上（仅 **HTTP 429** 重试）。
 */
export async function requestGetWith429Retry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["get"]>[1],
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options);
  let res = await withTransientNetRetry(() => request.get(url, opts));
  if (res.ok()) return res;
  if (res.status() !== 429) return res;
  const body1 = await res.text();
  const waitMs = waitMsFromRateLimitResponse(res.headers(), body1);
  await new Promise((r) => setTimeout(r, waitMs));
  return withTransientNetRetry(() => request.get(url, opts));
}

/**
 * **`DELETE`**：同上。
 */
export async function requestDeleteWith429Retry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["delete"]>[1],
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options);
  let res = await withTransientNetRetry(() => request.delete(url, opts));
  if (res.ok()) return res;
  if (res.status() !== 429) return res;
  const body1 = await res.text();
  const waitMs = waitMsFromRateLimitResponse(res.headers(), body1);
  await new Promise((r) => setTimeout(r, waitMs));
  return withTransientNetRetry(() => request.delete(url, opts));
}

/**
 * **`PATCH`**：**HTTP 429** 时读体、退避、**重试一次**；其它非 **ok** 原样返回。
 */
export async function requestPatchWith429Retry(
  request: APIRequestContext,
  url: string,
  options: Parameters<APIRequestContext["patch"]>[1] & object,
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options) as Parameters<APIRequestContext["patch"]>[1] & object;
  let res = await withTransientNetRetry(() => request.patch(url, opts));
  if (res.ok()) return res;
  if (res.status() !== 429) return res;
  const body1 = await res.text();
  const waitMs = waitMsFromRateLimitResponse(res.headers(), body1);
  await new Promise((r) => setTimeout(r, waitMs));
  return withTransientNetRetry(() => request.patch(url, opts));
}

/**
 * **`POST`**：非 **ok** 且疑似限流时退避并重试（同 **options**；**最多 `RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS` 次**）。
 */
export async function requestPostExpectOkWith429Backoff(
  request: APIRequestContext,
  url: string,
  options: Parameters<APIRequestContext["post"]>[1] & object,
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options) as Parameters<APIRequestContext["post"]>[1] & object;
  let lastRes: APIResponse | null = null;
  let lastBody = "";
  for (let attempt = 0; attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS; attempt++) {
    const res = await withTransientNetRetry(() => request.post(url, opts));
    lastRes = res;
    lastBody = await res.text();

    if (looksBackoffEligibleRateLimit(res.status(), lastBody)) {
      if (attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS - 1) {
        const waitMs = waitMsFromRateLimitResponse(res.headers(), lastBody);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      expect(false, lastBody).toBeTruthy();
      return lastRes as APIResponse;
    }

    if (!res.ok()) {
      expect(res.ok(), lastBody).toBeTruthy();
      return res;
    }

    /**
     * 成功：**`text()`** 已消费流 —— 仍以 **`HTTP`/`headers`** **委托**，**`json()`/`text()`** **经缓存体**以满足调用方（**不必要** **`Idempotency-Key`** 二次 **`POST`**）。
     */
    const envelope = parseJsonFromEnvelopeOrThrow(lastBody);
    if (envelope?.status === "error") {
      expect(false, lastBody).toBeTruthy();
      return lastRes as APIResponse;
    }

    return apiResponseReuseConsumedText(res, lastBody);
  }
  expect(lastRes?.ok() ?? false, lastBody).toBeTruthy();
  return lastRes as APIResponse;
}

/**
 * **`GET`**：同上（**最多 `RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS` 次**）。
 */
export async function requestGetExpectOkWith429Backoff(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["get"]>[1],
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options);
  let lastRes: APIResponse | null = null;
  let lastBody = "";
  for (let attempt = 0; attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS; attempt++) {
    const res = await withTransientNetRetry(() => request.get(url, opts));
    lastRes = res;
    if (res.ok()) return res;
    lastBody = await res.text();
    if (!looksBackoffEligibleRateLimit(res.status(), lastBody)) {
      expect(res.ok(), lastBody).toBeTruthy();
      return res;
    }
    if (attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS - 1) {
      const waitMs = waitMsFromRateLimitResponse(res.headers(), lastBody);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  expect(lastRes?.ok() ?? false, lastBody).toBeTruthy();
  return lastRes as APIResponse;
}

/**
 * **`DELETE`**：同上（**最多 `RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS` 次**）。
 */
export async function requestDeleteExpectOkWith429Backoff(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["delete"]>[1],
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options);
  let lastRes: APIResponse | null = null;
  let lastBody = "";
  for (let attempt = 0; attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS; attempt++) {
    const res = await withTransientNetRetry(() => request.delete(url, opts));
    lastRes = res;
    if (res.ok()) return res;
    lastBody = await res.text();
    if (!looksBackoffEligibleRateLimit(res.status(), lastBody)) {
      expect(res.ok(), lastBody).toBeTruthy();
      return res;
    }
    if (attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS - 1) {
      const waitMs = waitMsFromRateLimitResponse(res.headers(), lastBody);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  expect(lastRes?.ok() ?? false, lastBody).toBeTruthy();
  return lastRes as APIResponse;
}

/**
 * **`PATCH`**：同上（**最多 `RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS` 次**）。
 */
export async function requestPatchExpectOkWith429Backoff(
  request: APIRequestContext,
  url: string,
  options: Parameters<APIRequestContext["patch"]>[1] & object,
): Promise<APIResponse> {
  const opts = withDefaultApiRequestTimeout(options) as Parameters<APIRequestContext["patch"]>[1] & object;
  let lastRes: APIResponse | null = null;
  let lastBody = "";
  for (let attempt = 0; attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS; attempt++) {
    const res = await withTransientNetRetry(() => request.patch(url, opts));
    lastRes = res;
    if (res.ok()) return res;
    lastBody = await res.text();
    if (!looksBackoffEligibleRateLimit(res.status(), lastBody)) {
      expect(res.ok(), lastBody).toBeTruthy();
      return res;
    }
    if (attempt < RATE_LIMIT_EXPECT_OK_MAX_ATTEMPTS - 1) {
      const waitMs = waitMsFromRateLimitResponse(res.headers(), lastBody);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  expect(lastRes?.ok() ?? false, lastBody).toBeTruthy();
  return lastRes as APIResponse;
}
