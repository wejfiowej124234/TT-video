/**
 * Pass A after screenshot · `TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`
 *
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test capture-earth-realism-pass-a --config=playwright.scene-debug.probe.config.ts
 */
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(
  process.cwd(),
  "evidence/GO_local_hero_globe_a_closure/earth-realism-pass-a",
);

test("capture hero earth realism pass A desktop", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
  await page.waitForSelector('[data-tt-traveltrust-hero-globe-unobstructed="1"]', { timeout: 60_000 });
  await waitTraveltrustHeroSettled(page, 60_000);

  await page.screenshot({
    path: join(OUT_DIR, "hero-earth-realism-pass-a-desktop.png"),
    fullPage: false,
  });
});
