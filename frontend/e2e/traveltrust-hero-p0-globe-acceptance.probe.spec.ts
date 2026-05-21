/**
 * P0 · Hero 主视觉验收（① 本地）
 * 硬刷新后：完整地球 + 大陆 + Phase1 航线/枢纽；零遮挡 Canvas 的 DOM 背景板。
 *
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/p0-acceptance");

const BLOCKER_SELECTORS = [
  "#hero video",
  "[data-tt-traveltrust-hero-sky-wash-l5]",
  "[data-tt-traveltrust-canvas-hero-sky-cap-l5]",
  "[data-tt-traveltrust-hero-dom-sky-veil-unified]",
  "[data-tt-traveltrust-canvas-warm-base-l5]",
  "[data-tt-traveltrust-hero-warm-backdrop-l5]",
  "[data-tt-traveltrust-hero-copy-scrim]",
  "[data-tt-traveltrust-hero-copy-shimmer-l5]",
  "[data-tt-traveltrust-canvas-warm-band-l5]",
  "[data-tt-traveltrust-canvas-hero-bridge-shimmer-l5]",
  "[data-tt-traveltrust-cinematic-viewport-ink-hero-split-feather-l5]",
] as const;

test("P0 hero globe acceptance · blockers off + WebGL draws earth/arcs", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
  await page.waitForSelector('[data-tt-traveltrust-hero-globe-unobstructed="1"]', { timeout: 60_000 });
  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-frameloop="always"]', { timeout: 60_000 });
  await waitTraveltrustHeroSettled(page, 60_000);

  await page.waitForFunction(
    () => {
      const canvas = document.querySelector(
        '[data-tt-traveltrust-page-cinematic-3d] canvas',
      ) as HTMLCanvasElement | null;
      if (!canvas || canvas.width < 2) return false;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) return false;
      c.width = canvas.width;
      c.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
      const x = Math.floor(canvas.width * 0.28);
      const y = Math.floor(canvas.height * 0.42);
      const d = ctx.getImageData(x, y, 1, 1).data;
      return d[3] > 200 && d[0] + d[1] + d[2] > 24;
    },
    { timeout: 90_000 },
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.waitForFunction(
    () => {
      const canvas = document.querySelector(
        '[data-tt-traveltrust-page-cinematic-3d] canvas',
      ) as HTMLCanvasElement | null;
      if (!canvas || canvas.width < 2) return false;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) return false;
      c.width = canvas.width;
      c.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
      const x = Math.floor(canvas.width * 0.28);
      const y = Math.floor(canvas.height * 0.42);
      const d = ctx.getImageData(x, y, 1, 1).data;
      return d[3] > 200 && d[0] + d[1] + d[2] > 24;
    },
    { timeout: 30_000 },
  );

  const blockers = await page.evaluate((selectors) => {
    const counts: Record<string, number> = {};
    for (const sel of selectors) counts[sel] = document.querySelectorAll(sel).length;
    return counts;
  }, [...BLOCKER_SELECTORS]);

  for (const sel of BLOCKER_SELECTORS) {
    expect(blockers[sel], `blocker ${sel}`).toBe(0);
  }

  const shell = await page.evaluate(() => {
    const root = document.querySelector('[data-tt-traveltrust-page-cinematic-3d]');
    if (!root) return null;
    return {
      unobstructed: root.getAttribute("data-tt-traveltrust-hero-globe-unobstructed"),
      overlayEmpty: root.getAttribute("data-tt-traveltrust-hero-canvas-overlay-empty"),
      frameloop: root.getAttribute("data-tt-traveltrust-page-cinematic-frameloop"),
      power: root.getAttribute("data-tt-traveltrust-page-cinematic-power"),
      opacity: getComputedStyle(root).opacity,
      heroT: root.getAttribute("data-tt-traveltrust-hero-t"),
      domVideo: document.querySelector("#hero")?.getAttribute("data-tt-traveltrust-hero-dom-video"),
    };
  });

  expect(shell).toEqual({
    unobstructed: "1",
    overlayEmpty: "1",
    frameloop: "always",
    power: "active",
    opacity: "1",
    heroT: expect.stringMatching(/^0\./),
    domVideo: "0",
  });

  const shotPath = join(OUT_DIR, "hero-p0-hard-refresh.png");
  await page.screenshot({ path: shotPath, fullPage: false });
  await expect(page.locator('[data-tt-traveltrust-hero-copy-card="1"]')).toBeVisible();
  await expect(page.locator('[data-tt-traveltrust-hero-globe-viewport="1"]')).toBeVisible();
});
