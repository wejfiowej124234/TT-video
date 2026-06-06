/**
 * P1 · 首页模块化目视 QA（① 本地 · 可自动化子集）
 *
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-home-modular-visual-qa --config=playwright.scene-debug.probe.config.ts
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { TRAVELTRUST_HOME_VISUAL_QA_MANIFEST } from "../lib/traveltrust/home/visualQaManifest";
import { traveltrustNetworkPageShell } from "./helpers/pageShells";

const OUT_DIR = join(process.cwd(), "evidence/traveltrust-home-visual-qa/e2e-runs");

test.describe("traveltrust-home modular visual QA (automated manifest)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  for (const entry of TRAVELTRUST_HOME_VISUAL_QA_MANIFEST) {
    if (!entry.e2eSelectors?.length || !entry.e2ePath) continue;

    test(`[${entry.id}] manifest e2e selectors`, async ({ page }) => {
      test.setTimeout(180_000);
      mkdirSync(OUT_DIR, { recursive: true });

      await page.goto(entry.e2ePath, { waitUntil: "domcontentloaded" });
      await traveltrustNetworkPageShell(page).waitFor({ state: "attached", timeout: 120_000 });

      if (entry.id === "globe-entrance") {
        await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
      }

      for (const sel of entry.e2eSelectors) {
        if (sel.startsWith("#")) {
          await expect(page.locator(sel).first()).toBeAttached({ timeout: 90_000 });
        } else {
          await expect(page.locator(sel).first()).toBeAttached({ timeout: 90_000 });
        }
      }

      await page.screenshot({
        path: join(OUT_DIR, `${entry.id}.png`),
        fullPage: entry.id === "below-fold-film-dividers" || entry.id === "economy-cluster-atmosphere",
      });
    });
  }
});
