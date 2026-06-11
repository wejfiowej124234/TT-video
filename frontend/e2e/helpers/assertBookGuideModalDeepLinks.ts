import { expect, type Page } from "@playwright/test";
import { bookGuideCtaShell } from "./pageShells";

/** GD-L5-P3 · itinerary-first：无行程时主 CTA 为创建行程；有行程时为 bind 按钮（非 `/orders/new`） */
export async function expectBookGuideModalDeepLinks(page: Page, guideId: string): Promise<void> {
  const g = guideId.trim();
  const primary = bookGuideCtaShell(page, "primary");
  await expect(primary).toBeVisible();
  const tag = await primary.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "a") {
    expect(await primary.getAttribute("href")).toBe(`/itinerary/new?guide_id=${encodeURIComponent(g)}`);
  } else {
    expect(tag).toBe("button");
  }

  const market = bookGuideCtaShell(page, "market_custom");
  await expect(market).toBeVisible();
  expect(await market.getAttribute("href")).toBe(`/market?guide_id=${g}`);
}
