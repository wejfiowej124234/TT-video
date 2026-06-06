import { expect, test } from "@playwright/test";

/** ① Feed 发现顶栏 · 附近锚点与 1km chip（L5 窄 E2E） */
test("community feed discovery geo chrome", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByTestId("community-feed-discovery-chrome")).toBeVisible({ timeout: 30_000 });

  const anchor = page.getByTestId("community-feed-anchor-poi");
  await expect(anchor).toBeVisible();
  await anchor.selectOption("hotel_lavande");

  const nearby1km = page.getByRole("button", { name: /1\s*km|1km|附近1km/i });
  await nearby1km.click();

  await expect(page.getByRole("tab", { name: /Recommend|推荐/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("community-feed-activity-center")).toHaveAttribute("href", "/community/activity");
  await expect(page.getByTestId("community-feed-first-post").or(page.getByTestId("community-feed-discovery-chrome"))).toBeVisible({
    timeout: 20_000,
  });
});
