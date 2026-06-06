import { expect, type Locator, type Page } from "@playwright/test";

import { payMockPaySubmitShell, payRootPageShell } from "./pageShells";
import { gotoSmoke, reloadSmoke, waitForUrlSmoke } from "./smoke-nav";

const mockPayButtonRe = /Simulate deposit \(chain-off\)|模拟入金（链下）/;

/**
 * `/pay` 链下模拟入金 CTA：`next start` 须 build 时 `NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=1`
 *（见 `scripts/run-e2e-default.mjs`）；勿仅匹配 loading 骨架 `data-tt-pay-root`。
 */
export async function expectPayPageMockPayCtaReady(
  page: Page,
  timeout = 90_000,
): Promise<Locator> {
  const payShell = payRootPageShell(page);
  await expect(payShell).toBeVisible({ timeout });
  await expect(payShell).toHaveAttribute("data-tt-pay-order-fetch-phase", "ready", {
    timeout,
  });
  const mockPayBtn = payMockPaySubmitShell(page).or(
    payShell.getByRole("button", { name: mockPayButtonRe }),
  );
  await expect(mockPayBtn).toBeVisible({ timeout });
  await expect(mockPayBtn).toBeEnabled({ timeout });
  return mockPayBtn;
}

/** `/pay?orderId=`：`next start` 下 GET 与 hydrate 竞态时 reload 收口（与 b466/b467 同源）。 */
export async function navigatePayHubAndExpectMockPayCtaReady(
  page: Page,
  payUrl: string,
  orderId: string,
  timeout = 90_000,
): Promise<Locator> {
  await gotoSmoke(page, payUrl, { timeout });
  await waitForUrlSmoke(page, /\/pay/, { timeout });
  await page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      r.url().includes(`/api/v1/orders/${orderId}`) &&
      r.status() === 200,
    { timeout: 120_000 },
  );
  await reloadSmoke(page, { timeout });
  await waitForUrlSmoke(page, /\/pay/, { timeout });
  await page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      r.url().includes(`/api/v1/orders/${orderId}`) &&
      r.status() === 200,
    { timeout: 120_000 },
  );
  return expectPayPageMockPayCtaReady(page, timeout);
}
