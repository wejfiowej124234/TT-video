import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";

import { seedAndLoginTouristTestCredentials, seedTestAccounts } from "./apiSession";
import { requestPostWith429Retry } from "./playwright429Backoff";

export type BearerSeedTouristTestComOpts = {
  password?: string;
  /**
   * 并入登录 POST（在 `Content-Type: application/json` 之后），例如 **`Idempotency-Key`**
   *（**`REQUIRE_IDEMPOTENCY_KEY=1`** 下 **`e2e:api-f027-f028-f033-local`** 等同源）。
   */
  loginExtraHeaders?: Record<string, string>;
};

/**
 * **`auth/seed-test-accounts`** + **`tourist@test.com`** 真实登录，与 **96-18** 已付费 **`provider` / `region_steward`**
 * 权益及 **`POST …/market/{segment}/listings`** 写闸对齐（非 mock）。
 */
export async function bearerSeedTouristTestCom(
  request: APIRequestContext,
  apiBase: string,
  opts?: BearerSeedTouristTestComOpts,
): Promise<string> {
  const password = opts?.password ?? "Test123!";
  const extra = opts?.loginExtraHeaders;
  if (!extra || Object.keys(extra).length === 0) {
    const cred = await seedAndLoginTouristTestCredentials(request, apiBase, password);
    expect(cred?.token, "login tourist@test.com after seed").toBeTruthy();
    return cred!.token;
  }

  await seedTestAccounts(request, apiBase);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const loginPath = "/auth/login";
  const loginUrl = apiBase.replace(/\/$/, "") + loginPath;
  const loginRes = await requestPostWith429Retry(request, loginUrl, {
    headers: headers,
    data: { email: "tourist@test.com", password: password },
  });
  expect(loginRes.ok(), `login tourist@test.com HTTP ${loginRes.status()}`).toBeTruthy();
  const lj = (await loginRes.json()) as { status?: string; token?: string };
  expect(lj.status).toBe("ok");
  const token = lj.token?.trim() ?? "";
  expect(token.length).toBeGreaterThan(0);
  return token;
}
