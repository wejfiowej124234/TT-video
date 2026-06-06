/**
 * Phase ②/③ · staging 前端最小验收（已部署 tt-web-staging · 不启本地 dev server）
 *
 * 须 STAGING_WEB_SMOKE=1；由 scripts/dev/smoke-staging-web.sh 驱动。
 *
 * 边界：可浏览 staging UI · ≠ Production GO
 */
import { test, expect } from "@playwright/test";

import { defaultApiBase } from "./helpers/apiSession";

function stagingGate(): boolean {
  return process.env.STAGING_WEB_SMOKE === "1" && Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
}

(stagingGate() ? test.describe : test.describe.skip)("staging web · minimal smoke", () => {
  test.setTimeout(120_000);

  test("首页可加载且无 error boundary", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
    await expect(
      page.getByRole("main", { name: /Start your dream|梦想之旅|dream trip/i }),
    ).toBeVisible({ timeout: 60_000 });
  });

  test("市场页 shell 可访问", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });
  });

  test("社区 Feed shell 可访问", async ({ page }) => {
    await page.goto("/community");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
    await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible({ timeout: 60_000 });
  });

  test("浏览器可跨域 GET staging API /meta（CORS）", async ({ page }) => {
    const apiBase = defaultApiBase();
    const chainId = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/meta`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { chain?: { chain_id?: string | number } };
      return String(body.chain?.chain_id ?? "");
    }, apiBase);
    expect(chainId).toBe(process.env.PLAYWRIGHT_EXPECT_CHAIN_ID ?? "11155111");
  });

  test("登录页可访问", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/页面加载异常/)).toHaveCount(0);
    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });
  });
});
