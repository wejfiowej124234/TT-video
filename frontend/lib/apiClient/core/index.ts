/**
 * API 客户端公共能力：请求 id、响应解析、鉴权头（与 04 §三、14 一致）
 *
 * 实现拆分为同目录子模块（**`rateLimitAndFetch`** / **`authSession`** / **`requestHeaders`** / **`responseParse`** / **`envelope`**）；本文件为 **barrel**。
 */

export {
  apiFetch,
  getApiRetryAfterSeconds,
  coalesceRetryAfterSecondsFromJson,
  waitMsFromRateLimitHttpSnapshot,
  RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS,
  RATE_LIMIT_HTTP_BACKOFF_CAP_MS,
  RATE_LIMIT_HTTP_BACKOFF_MIN_MS,
  retryAfterSecondsFrom429Response,
} from "./rateLimitAndFetch";

export type { AuthHeaders } from "./authSession";
export {
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  AUTH_SESSION_OK_COOKIE,
  clearAuthSessionCookies,
  clearAuthSessionOkCookie,
  clearClientAuthStorage,
  getAuthHeaders,
  writeAuthSessionOkCookie,
} from "./authSession";

export { requestId, getIdempotencyKey, writeRequestHeaders } from "./requestHeaders";

export { parseResponse } from "./responseParse";

export {
  isComplianceError,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
  fetchJsonWithApiStatusLog,
} from "./envelope";
