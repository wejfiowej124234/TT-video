/**
 * `/market?orderId=` / `?guideId=` 与订单/向导详情抽屉深链（与 `useMarketPage` + `marketDeepLink.ts` 对齐）。
 */
import { test, expect } from "@playwright/test";

const STABLE_GUIDE_UUID = "00000000-0000-0000-0000-0000000000aa";
const STABLE_ORDER_UUID = "00000000-0000-0000-0000-0000000000bb";

const marketDeepStability = process.env.PLAYWRIGHT_E2E_STABILITY === "1" || process.env.CI === "true";
const marketDeepGotoMs = marketDeepStability ? 120_000 : 60_000;
const marketDeepShellMs = marketDeepStability ? 60_000 : 15_000;

test.describe("Market deep link (orderId / guideId)", () => {
  test("guideId opens guide detail drawer", async ({ page }) => {
    await page.goto(`/market?guideId=${STABLE_GUIDE_UUID}`, { timeout: marketDeepGotoMs });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: marketDeepShellMs });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: marketDeepShellMs });
    await expect(dialog.getByRole("heading", { name: /向导详情|Guide details/i })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`guideId=${STABLE_GUIDE_UUID}`));
  });

  test("orderId opens order detail drawer", async ({ page }) => {
    await page.goto(`/market?orderId=${STABLE_ORDER_UUID}`, { timeout: marketDeepGotoMs });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: marketDeepShellMs });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: marketDeepShellMs });
    await expect(dialog.getByRole("heading", { name: /订单详情|Order details/i })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`orderId=${STABLE_ORDER_UUID}`));
  });

  test("closing guide drawer removes guideId from URL", async ({ page }) => {
    await page.goto(`/market?guideId=${STABLE_GUIDE_UUID}`, { timeout: marketDeepGotoMs });
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: marketDeepShellMs });
    await page.getByRole("button", { name: /关闭向导详情|Close guide detail/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).not.toHaveURL(/guideId=/);
  });

  test("invalid orderId is stripped and order detail drawer does not open", async ({ page }) => {
    await page.goto("/market?orderId=not-a-uuid", { timeout: marketDeepGotoMs });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: marketDeepShellMs });
    await expect(page).not.toHaveURL(/orderId=not-a-uuid/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("invalid guideId is stripped and guide detail drawer does not open", async ({ page }) => {
    await page.goto("/market?guideId=bad-id", { timeout: marketDeepGotoMs });
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: marketDeepShellMs });
    await expect(page).not.toHaveURL(/guideId=bad-id/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
