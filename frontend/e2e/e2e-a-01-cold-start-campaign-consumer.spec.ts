import { test, expect } from "@playwright/test";

test.describe("E2E-A-01 cold start campaign consumer surfaces", () => {
  test("public API surfaces respond", async ({ request }) => {
    for (const surface of ["home_hero", "market_feed", "community_feed"]) {
      const res = await request.get(`/api/v1/official/cold-start/surfaces/${surface}`);
      expect(res.ok()).toBeTruthy();
      const json = (await res.json()) as { status: string; surface: string; campaign: unknown };
      expect(json.status).toBe("ok");
      expect(json.surface).toBe(surface);
      expect(Object.prototype.hasOwnProperty.call(json, "campaign")).toBe(true);
    }
  });

  test("home hides probe cold-start or shows consumer cards; value preview when idle", async ({ page }) => {
    await page.goto("/plan");
    const consumerPanel = page.locator('[data-tt-cold-start-consumer="1"]');
    const count = await consumerPanel.count();
    if (count > 0) {
      await expect(consumerPanel).toHaveAttribute("data-tt-cold-start-ready", "1");
      await expect(page.locator('[data-tt-cold-start-consumer-card]').first()).toBeVisible();
      await expect(page.locator('[data-tt-cold-start-consumer-cta]').first()).toBeVisible();
      await expect(page.locator("text=/L5[-_]/i")).toHaveCount(0);
      await expect(page.locator("text=/\\bProbe\\b/i")).toHaveCount(0);
      await expect(page.locator('[data-tt-cold-start-campaign-panel="1"]')).toHaveCount(0);
    }
    await expect(page.locator('[data-tt-home-consumer-value="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-pes-role-bar="persistent"]')).toHaveCount(0);
    await expect(page.locator('[data-tt-pes-role-grid="1"]')).toHaveCount(0);
    await expect(page.locator('[data-tt-pes-escrow-trust="card"]')).toHaveCount(0);
  });

  test("market/community expose cold-start state markers", async ({ page }) => {
    for (const path of ["/market", "/community"]) {
      await page.goto(path);
      await expect(page.locator("[data-tt-cold-start-surface]")).toHaveCount(1);
      const stateMarker = page.locator(
        "[data-tt-cold-start-loading], [data-tt-cold-start-empty], [data-tt-cold-start-error], [data-tt-cold-start-ready]",
      );
      await expect(stateMarker.first()).toBeVisible();
    }
  });
});
