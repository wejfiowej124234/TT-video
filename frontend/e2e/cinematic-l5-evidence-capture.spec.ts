/**
 * §6.2 全页电影 L5 证据截图（① · maintainer）
 *
 * 前置：本地 dev 已起（默认 http://127.0.0.1:3012）
 *
 *   bash scripts/gates/capture-cinematic-l5-evidence.sh
 *
 * 产出：`frontend/evidence/GO_local_cinematic_l5_closure/*.png`
 */
import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { existsSync } from "node:fs";

import {
  installTraveltrustVisualStability,
  waitTraveltrustHeroSettled,
} from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = path.join(__dirname, "../evidence/GO_local_cinematic_l5_closure");
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012";
const STABLE = process.env.CAPTURE_CINEMATIC_L5_STABLE === "1";

async function assertTraveltrustL0SiteNavVisible(page: Page) {
  await expect(page.locator('[data-tt-marketing-header-site-nav="1"]')).toHaveCount(1);
  await expect(page.locator('[data-tt-traveltrust-header-merged-chrome-l5="0"]')).toHaveCount(1);
}

test.describe("Cinematic L5 evidence capture (§6.2)", () => {
  test.skip(() => process.env.CAPTURE_CINEMATIC_L5 !== "1", "Set CAPTURE_CINEMATIC_L5=1 to write PNGs");

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    if (STABLE) {
      await installTraveltrustVisualStability(page);
    }
  });

  test("hero-scroll-handoff-l5.png (C2)", async ({ page }) => {
    await page.goto(`${BASE}/traveltrust`, { waitUntil: "domcontentloaded" });
    await assertTraveltrustL0SiteNavVisible(page);
    if (STABLE) {
      await waitTraveltrustHeroSettled(page);
    }
    await page.locator("#roles").scrollIntoViewIfNeeded();
    await page.waitForTimeout(STABLE ? 300 : 600);
    await expect(page.locator("#roles")).toBeVisible();
    await page.screenshot({
      path: path.join(OUT_DIR, "hero-scroll-handoff-l5.png"),
      fullPage: false,
    });
  });

  test("roles-theater-l5.png (C3/C4)", async ({ page }) => {
    await page.goto(`${BASE}/traveltrust#roles`, { waitUntil: "domcontentloaded" });
    await assertTraveltrustL0SiteNavVisible(page);
    await expect(page.locator('[data-tt-traveltrust-theater-l5="1"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-tt-traveltrust-role-video-warm-placeholder-l5="1"]').first()).toBeAttached({
      timeout: 10_000,
    });
    await expect(page.locator('[data-tt-traveltrust-role-video-tourism-hint-l5="1"]').first()).toBeVisible();
    const guideTab = page.locator("#tab-guide");
    await guideTab.scrollIntoViewIfNeeded();
    await guideTab.click({ force: true });
    await expect(page.locator("#panel-guide")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-tt-traveltrust-theater-l5="1"]')).toHaveAttribute(
      "data-tt-traveltrust-active-role-id",
      "guide",
      { timeout: 15_000 },
    );
    await expect(page.locator('[data-tt-traveltrust-role-video-id="guide"]')).toBeAttached({
      timeout: 15_000,
    });
    await page.waitForTimeout(STABLE ? 350 : 600);
    await page.screenshot({
      path: path.join(OUT_DIR, "roles-theater-l5.png"),
      fullPage: false,
    });
  });

  test("faq-trust-l5.png (C6 optional)", async ({ page }) => {
    await page.goto(`${BASE}/traveltrust#trust`, { waitUntil: "domcontentloaded" });
    await assertTraveltrustL0SiteNavVisible(page);
    await expect(page.locator('[data-tt-traveltrust-trust-facts-l5="1"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-tt-traveltrust-trust-warm-plate-l5="1"]')).toBeVisible();
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-tt-traveltrust-faq-warm-plate-l5="1"]')).toBeVisible();
    await page.waitForTimeout(STABLE ? 400 : 700);
    await page.screenshot({
      path: path.join(OUT_DIR, "faq-trust-l5.png"),
      fullPage: false,
    });
  });

  test("settlement-liquidity-l5.png (C7 optional)", async ({ page }) => {
    await page.goto(`${BASE}/traveltrust#settlement`, { waitUntil: "domcontentloaded" });
    await assertTraveltrustL0SiteNavVisible(page);
    await expect(page.locator('[data-tt-traveltrust-economy-cluster-atmosphere-l5="1"]')).toBeVisible({
      timeout: 15_000,
    });
    await page.locator("#liquidity").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-tt-traveltrust-economy-cluster-atmosphere-l5="1"]')).toBeVisible();
    await expect(page.locator('[data-tt-traveltrust-liquidity-l5-defer="illustrative-only"]')).toBeAttached();
    await page.waitForTimeout(STABLE ? 400 : 700);
    await page.screenshot({
      path: path.join(OUT_DIR, "settlement-liquidity-l5.png"),
      fullPage: false,
    });
  });

  test("start-steps-l5.png (C5)", async ({ page }) => {
    await page.goto(`${BASE}/traveltrust#start`, { waitUntil: "domcontentloaded" });
    await assertTraveltrustL0SiteNavVisible(page);
    await expect(page.locator('[data-tt-traveltrust-start-steps-l5="1"]')).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(STABLE ? 800 : 2800);
    await expect(page.locator('[data-tt-traveltrust-start-route-preview-l5="1"]')).toBeVisible();
    await page.screenshot({
      path: path.join(OUT_DIR, "start-steps-l5.png"),
      fullPage: false,
    });
  });

  test.afterAll(() => {
    const required = [
      "hero-scroll-handoff-l5.png",
      "roles-theater-l5.png",
      "start-steps-l5.png",
    ] as const;
    for (const name of required) {
      const p = path.join(OUT_DIR, name);
      if (!existsSync(p)) {
        throw new Error("Missing evidence PNG: " + p);
      }
    }
  });
});
