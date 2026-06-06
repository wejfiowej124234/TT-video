/**
 * D6 · 224-D · community Feed 首条在 390×844 视口内可见（G9 子集）
 */
import { test, expect } from "@playwright/test";

import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

test.describe("PI-1 · community feed mobile first post", () => {
  test("first feed card intersects viewport at 390×844", async ({ page, request }) => {
    await skipIfApiDown(request);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSmoke(page, "/community");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 45_000 });

    const firstPost = page.locator('[data-testid="community-feed-first-post"]').first();
    await expect(firstPost).toBeVisible({ timeout: 60_000 });

    const box = await firstPost.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.y).toBeLessThan(844);
      expect(box.y + box.height).toBeLessThanOrEqual(844 + 48);
    }
  });
});
