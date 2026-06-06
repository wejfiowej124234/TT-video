import { expect, type Page } from "@playwright/test";
import { bookGuideCtaShell } from "./pageShells";

/** 与 **`BookGuideModal`** + **`ordersNewHrefForGuide` / `marketHrefForGuideCustomItinerary`** 同源：主链路与次要 CTA 的 **`href`** 真值。 */
export async function expectBookGuideModalDeepLinks(page: Page, guideId: string): Promise<void> {
  const g = guideId.trim();
  const primary = bookGuideCtaShell(page, "primary");
  await expect(primary).toBeVisible();
  expect(await primary.getAttribute("href")).toBe(`/orders/new?guide_id=${g}`);

  const itin = bookGuideCtaShell(page, "itinerary");
  await expect(itin).toBeVisible();
  expect(await itin.getAttribute("href")).toBe(`/itinerary/new?guide_id=${encodeURIComponent(g)}`);

  const market = bookGuideCtaShell(page, "market_custom");
  await expect(market).toBeVisible();
  expect(await market.getAttribute("href")).toBe(`/market?guide_id=${g}`);
}
