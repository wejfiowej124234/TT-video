/**
 * Custom Itinerary W3 · geo/POI 展示（flag=0 默认 TS）· 不切报价链
 */
import { test, expect, type Locator } from "@playwright/test";
import { gotoSmoke } from "./helpers/smoke-nav";
import { customItineraryModalShell, marketPageShell } from "./helpers/pageShells";

const COUNTRY_TRIGGER = /^(Country|国家)$/;
const TOTAL_DAYS_TRIGGER = /Total days|总天数|行程天数/;

function dayPanel(dlg: Locator, dayNum: number): Locator {
  const heading = dlg.getByRole("heading", {
    level: 3,
    name: new RegExp(`第\\s*${dayNum}\\s*天|Day\\s*${dayNum}`, "i"),
  });
  return heading.locator("..").locator("..");
}

test.describe("Custom Itinerary W3 catalog UI (flag=0)", () => {
  test("country/city/attraction pills visible from TS geo (no API required)", async ({ page }) => {
    test.setTimeout(120_000);

    await gotoSmoke(page, "/market");
    const marketShell = marketPageShell(page);
    await expect(marketShell).toBeVisible({ timeout: 60_000 });

    const openItinerary = marketShell.getByRole("button", { name: /Custom itinerary|自定义行程/i });
    await expect(openItinerary).toBeVisible({ timeout: 60_000 });
    await openItinerary.scrollIntoViewIfNeeded();
    await openItinerary.click({ force: true });

    const modal = customItineraryModalShell(page);
    await expect(modal).toBeVisible({ timeout: 60_000 });
    const dlg = modal.getByTestId("custom-itinerary-panel");
    await expect(dlg).toBeVisible({ timeout: 60_000 });

    await dlg
      .getByRole("group", { name: TOTAL_DAYS_TRIGGER })
      .getByRole("button", { name: /^2 days$|^2\s*天$/ })
      .click();

    await dlg.getByRole("button", { name: COUNTRY_TRIGGER }).click();
    await dlg.getByRole("option", { name: "中国" }).click();

    await expect(dlg.getByRole("heading", { level: 3, name: /第\s*1\s*天|Day\s*1/i })).toBeVisible({
      timeout: 60_000,
    });

    const day1 = dayPanel(dlg, 1);
    await day1.getByRole("button", { name: "北京", exact: true }).click();

    await expect(
      day1.getByRole("group", { name: /Attractions|景区/i }).getByRole("button", { name: "故宫" }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
