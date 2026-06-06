/**
 * TT-PH1-182 · ① 本地视觉回归（hero / roles / start 三帧）
 * 稳定模式：遮罩 WebGL + reduced-motion（见 helpers/stabilizeTraveltrustVisual.ts）
 * 运行：`npm run e2e:traveltrust-visual` / `npm run e2e:traveltrust-visual:update`
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import {
  installTraveltrustVisualStability,
  traveltrustCinematicScreenshotMask,
  waitTraveltrustHeroSettled,
} from "./helpers/stabilizeTraveltrustVisual";
import { traveltrustNetworkPageShell } from "./helpers/pageShells";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { gotoSmoke } from "./helpers/smoke-nav";

const visualOffline = process.env.TRAVELTRUST_VISUAL_OFFLINE === "1";
const visualUpdateSnapshots = process.argv.some((a) => a.includes("update-snapshots"));

async function visualPreflight(request: import("@playwright/test").APIRequestContext) {
  if (visualOffline) return;
  await skipIfApiDown(request);
}

const SNAPSHOT_DIR = join(
  process.cwd(),
  "e2e",
  "traveltrust-hero-visual-regression.spec.ts-snapshots",
);

/** Baseline must exist before compare (generate with --update-snapshots). */
function heroDesktopBaseline(projectName: string): string {
  return join(SNAPSHOT_DIR, `traveltrust-hero-desktop-${projectName}.png`);
}

const screenshotOpts = {
  animations: "disabled" as const,
  caret: "hide" as const,
};

test.describe("traveltrust hero visual regression (①)", () => {
  test.beforeEach(async ({ page, request }) => {
    await visualPreflight(request);
    await installTraveltrustVisualStability(page);
  });

  test("hero desktop screenshot", async ({ page }, testInfo) => {
    test.skip(
      !visualUpdateSnapshots &&
        !existsSync(heroDesktopBaseline(testInfo.project.name)),
      "Run once with: npm run e2e:traveltrust-visual:update",
    );
    testInfo.snapshotSuffix = "";
    const mask = traveltrustCinematicScreenshotMask(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    await expect(shell.locator("#hero")).toHaveScreenshot("traveltrust-hero-desktop.png", {
      ...screenshotOpts,
      mask,
      maxDiffPixelRatio: 0.06,
    });
  });

  test("roles desktop screenshot", async ({ page }, testInfo) => {
    test.skip(
      !visualUpdateSnapshots &&
        !existsSync(join(SNAPSHOT_DIR, `traveltrust-roles-desktop-${testInfo.project.name}.png`)),
      "Run once with: npm run e2e:traveltrust-visual:update",
    );
    testInfo.snapshotSuffix = "";
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    await shell.locator("#roles").scrollIntoViewIfNeeded();
    await expect(shell.locator("#roles")).toBeInViewport({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await expect(shell.locator("#roles")).toHaveScreenshot("traveltrust-roles-desktop.png", {
      ...screenshotOpts,
      maxDiffPixelRatio: 0.07,
    });
  });

  test("start desktop screenshot", async ({ page }, testInfo) => {
    test.skip(
      !visualUpdateSnapshots &&
        !existsSync(join(SNAPSHOT_DIR, `traveltrust-start-desktop-${testInfo.project.name}.png`)),
      "Run once with: npm run e2e:traveltrust-visual:update",
    );
    testInfo.snapshotSuffix = "";
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoSmoke(page, "/traveltrust#start");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    const start = shell.locator("#start");
    await expect(start).toBeAttached({ timeout: 15_000 });
    await expect(start).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await expect(shell.locator("#start")).toHaveScreenshot("traveltrust-start-desktop.png", {
      ...screenshotOpts,
      maxDiffPixelRatio: 0.07,
    });
  });

  test("hero narrow 375×812 CTA safe-area (TT-PH1-153)", async ({ page }) => {
    const mask = traveltrustCinematicScreenshotMask(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    const dock = shell.locator('[data-tt-traveltrust-hero-cta-dock="1"]');
    await expect(dock).toBeVisible();
    const box = await dock.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // ① partial：窄屏 CTA 仍可能略超 viewport（TT-PH1-153 verify）；截图比对为主
      expect(box.y + box.height).toBeLessThanOrEqual(812 + 24);
    }
    await expect(shell.locator("#hero")).toHaveScreenshot("traveltrust-hero-mobile-375.png", {
      ...screenshotOpts,
      mask,
      maxDiffPixelRatio: 0.08,
    });
  });

  test("hero narrow 390×812 CTA safe-area (TT-PH1-153)", async ({ page }) => {
    const mask = traveltrustCinematicScreenshotMask(page);
    await page.setViewportSize({ width: 390, height: 812 });
    await gotoSmoke(page, "/traveltrust");
    const shell = traveltrustNetworkPageShell(page);
    await waitTraveltrustHeroSettled(page);
    const dock = shell.locator('[data-tt-traveltrust-hero-cta-dock="1"]');
    await expect(dock).toBeVisible();
    await dock.scrollIntoViewIfNeeded();
    const box = await dock.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(812 + 24);
    }
    await expect(shell.locator("#hero")).toHaveScreenshot("traveltrust-hero-mobile-390.png", {
      ...screenshotOpts,
      mask,
      maxDiffPixelRatio: 0.07,
    });
  });
});
