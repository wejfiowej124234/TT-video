/**
 * §8.2 等 API-only Playwright 用例：**`GET /health`** 探活遇 **429** 时与 **`bilateralEscrowE2e`** 同源
 * **`requestGetWith429Retry`**（**`waitMsFromRateLimitResponse`** / **`core.waitMsFromRateLimitHttpSnapshot`**）。
 *
 * URL 真源 **`defaultApiHealthUrl()`**（**`PLAYWRIGHT_API_HEALTH_URL`** / **`PLAYWRIGHT_API_PORT`**），避免各 spec 手写 **`127.0.0.1:8080/health`** 分叉。
 */
import { test, type APIRequestContext, type APIResponse } from "@playwright/test";

import { defaultApiHealthUrl } from "./apiSession";
import { requestGetWith429Retry } from "./playwright429Backoff";

/** 探活成功时返回 **`GET /health`** 响应，便于调用方复用正文（避免二次请求）。 */
export async function skipIfApiDown(request: APIRequestContext): Promise<APIResponse> {
  const healthUrl = defaultApiHealthUrl();
  const health = await requestGetWith429Retry(request, healthUrl, { timeout: 90_000 }).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API not reachable at ${healthUrl}; start traveltrust-api`);
  }
  return health;
}
