import { test, type APIRequestContext } from "@playwright/test";

/**
 * 链上 / 混合部署下 `POST …/orders/:id/mock-pay` 固定 501（须 `P3_CHAIN_OFF=1`）。
 * 用无鉴权探针区分 501 vs 401，避免链上全栈跑 mock-pay 用例硬失败。
 *
 * - 设 `PLAYWRIGHT_FORCE_MOCK_PAY_E2E=1` 时不跳过（仍会按环境失败，仅用于显式覆盖门禁）。
 */
export async function skipUnlessOrderMockPayAvailable(
  request: APIRequestContext,
  apiBase: string,
): Promise<void> {
  if (process.env.PLAYWRIGHT_FORCE_MOCK_PAY_E2E === "1") {
    return;
  }
  const base = apiBase.replace(/\/$/, "");
  const res = await request.post(
    `${base}/api/v1/orders/00000000-0000-0000-0000-000000000001/mock-pay`,
    { headers: { "Content-Type": "application/json" }, data: "{}" },
  );
  if (res.status() === 501) {
    test.skip(
      true,
      "POST …/mock-pay 返回 501：当前 API 未启用链下 mock-pay（需 P3_CHAIN_OFF=1 且 chain_off）。链上/测试网环境跳过；本地链下全栈见 Epic-F ladder。",
    );
  }
}
