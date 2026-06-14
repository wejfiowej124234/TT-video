/**
 * PES CTA Bugfix · 市场页转化轨下一步不得误指治理。
 */
import { test, expect } from "@playwright/test";
import { marketPageShell } from "./helpers/pageShells";

test.describe("PES · market funnel next CTA", () => {
  test("find_guide stage shows travel-booking CTA, not governance", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/market", { waitUntil: "domcontentloaded", timeout: 90_000 });

    const marketShell = marketPageShell(page);
    await expect(marketShell).toBeVisible({ timeout: 90_000 });

    const rail = page.locator('[data-tt-pes-funnel-rail="market"]');
    await expect(rail).toBeVisible({ timeout: 60_000 });
    await expect(rail).toHaveAttribute("data-tt-pes-funnel-stage", "find_guide");

    const nextCta = rail.locator('[data-tt-pes-funnel-next-cta="1"]');
    await expect(nextCta).toBeVisible();
    await expect(nextCta).toHaveAttribute(
      "data-tt-pes-funnel-next-key",
      "pes2_funnel_next_market_travel"
    );

    const label = (await nextCta.innerText()).trim();
    expect(label).not.toMatch(/治理|governance/i);
    expect(label).toMatch(/订单|预约|order|booking/i);

    const href = await nextCta.getAttribute("href");
    expect(href ?? "").toMatch(/\/orders/);
    expect(href ?? "").not.toMatch(/governance/);
  });
});
