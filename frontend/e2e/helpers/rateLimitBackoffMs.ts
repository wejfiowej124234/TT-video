/**
 * Playwright `APIResponse` 限流退避：真源 **`lib/apiClient/core` · `waitMsFromRateLimitHttpSnapshot`**（与 **`parseResponse`** 同源）。
 */
export {
  RATE_LIMIT_HTTP_BACKOFF_DEFAULT_MS as RATE_LIMIT_DEFAULT_WAIT_MS,
  waitMsFromRateLimitHttpSnapshot as waitMsFromRateLimitResponse,
} from "../../lib/apiClient/core";
