/**
 * TT-PH1-150～158 / 190～193 · ① 机读截图旁证（非融资级人眼签字）
 * 产出：evidence/GO_local_traveltrust_ph1/verify/*.png
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { installTraveltrustVisualStability, waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";
import { traveltrustNetworkPageShell } from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

const VERIFY_DIR = join(process.cwd(), "..", "evidence", "GO_local_traveltrust_ph1", "verify");

test.describe("PH1 verify screenshots (① machine旁证)", () => {
  test.beforeEach(async ({ page, request }) => {
    await skipIfApiDown(request);
    mkdirSync(VERIFY_DIR, { recursive: true });
    await installTraveltrustVisualStability(page);
  });

  test("home 1280 + 375 (`app/(home)/page.tsx` SSOT)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoSmoke(page, "/");
    await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(VERIFY_DIR, "home-desktop-1280x800.png"), fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSmoke(page, "/");
    await expect(page.locator("#form")).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(VERIFY_DIR, "home-mobile-375x812.png"), fullPage: false });
  });

  test("traveltrust hero + roles + trust (TT-PH1-150～158/193)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-hero-desktop-1280x800.png"), fullPage: false });

    await gotoSmoke(page, "/traveltrust#roles");
    await expect(shell.locator("#roles")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-roles-desktop-1280x800.png"), fullPage: false });

    await gotoSmoke(page, "/traveltrust#liquidity");
    await expect(shell.locator('[data-tt-traveltrust-ttg-gateway-preview="1"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-liquidity-desktop-1280x800.png"), fullPage: false });

    await gotoSmoke(page, "/traveltrust#trust");
    await expect(shell.locator("#trust")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-trust-desktop-1280x800.png"), fullPage: false });

    await gotoSmoke(page, "/traveltrust#start");
    await expect(shell.locator("#start")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-start-desktop-1280x800.png"), fullPage: false });

    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSmoke(page, "/traveltrust");
    await waitTraveltrustHeroSettled(page);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-hero-mobile-375x812.png"), fullPage: false });

    await gotoSmoke(page, "/traveltrust#roles");
    await expect(shell.locator("#roles")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-roles-mobile-375x812.png"), fullPage: false });

    await page.setViewportSize({ width: 390, height: 812 });
    await gotoSmoke(page, "/traveltrust");
    await waitTraveltrustHeroSettled(page);
    const ctaDock = shell.locator('[data-tt-traveltrust-hero-cta-dock="1"]');
    await expect(ctaDock).toBeVisible();
    await page.screenshot({ path: join(VERIFY_DIR, "traveltrust-hero-mobile-390x812.png"), fullPage: false });
  });
});
