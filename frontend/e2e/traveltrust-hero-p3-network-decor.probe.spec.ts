/**
 * P3-A/B · Hero 全球网络装饰 + 右侧叙事（①）
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/p3-acceptance");

function readP3HeroState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const layer = document.querySelector('[data-tt-traveltrust-hero-p3-layer="1"]');
    const narrative = document.querySelector('[data-tt-traveltrust-hero-p3-narrative="1"]');
    return {
      nodeCount: document.querySelectorAll('[data-tt-traveltrust-hero-p3-node="1"]').length,
      labelCount: document.querySelectorAll('[data-tt-traveltrust-hero-p3-label="1"]').length,
      coreLabelCount: document.querySelector('[data-tt-traveltrust-hero-p3-labels="1"]')?.getAttribute(
        "data-tt-traveltrust-hero-p3-label-count",
      ),
      corridorCount: document.querySelectorAll("[data-tt-traveltrust-hero-p3-corridor]").length,
      lead: document.querySelector('[data-tt-traveltrust-hero-p3-lead="1"]')?.textContent?.trim() ?? "",
      pulseCount: document.querySelectorAll('[data-tt-traveltrust-hero-p3-pulse="1"]').length,
      layerCorridor: layer?.getAttribute("data-tt-traveltrust-hero-p3-corridor-active") ?? "",
      narrativeCorridor: narrative?.getAttribute("data-tt-traveltrust-hero-p3-corridor") ?? "",
      timelineSteps: document.querySelectorAll("[data-tt-traveltrust-hero-p3-timeline-step]").length,
      corridorStrip: document.querySelector('[data-tt-traveltrust-hero-p3-corridor-strip="1"]')?.textContent?.trim() ?? "",
      unobstructed: document.querySelector('[data-tt-traveltrust-hero-globe-unobstructed="1"]') !== null,
      domVideo: document.querySelector("#hero")?.getAttribute("data-tt-traveltrust-hero-dom-video"),
    };
  });
}

test.describe("P3 hero network decor · ①", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("default hero shows 24 nodes and 8 corridor arcs", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
    await waitTraveltrustHeroSettled(page, 60_000);
    await expect(page.locator('[data-tt-traveltrust-hero-p3-layer="1"]')).toBeAttached({ timeout: 30_000 });
    await expect(page.locator('[data-tt-traveltrust-hero-p3-narrative="1"]')).toBeAttached({
      timeout: 30_000,
    });

    const state = await readP3HeroState(page);
    expect(state.nodeCount).toBeGreaterThanOrEqual(24);
    expect(Number(state.coreLabelCount ?? "0")).toBe(6);
    expect(state.labelCount).toBeLessThanOrEqual(6);
    expect(state.labelCount).toBeGreaterThanOrEqual(4);
    expect(state.lead.length).toBeGreaterThan(0);
    expect(state.corridorCount).toBeGreaterThanOrEqual(8);
    expect(state.pulseCount).toBeGreaterThanOrEqual(1);
    expect(state.pulseCount).toBeLessThanOrEqual(8);
    expect(state.corridorStrip).toBe("");
    expect(state.timelineSteps).toBe(3);
    expect(state.domVideo).toBe("0");

    await page.screenshot({ path: join(OUT_DIR, "01-hero-p3-network-default.png") });
    writeFileSync(join(OUT_DIR, "p3-hero-report.json"), JSON.stringify(state, null, 2), "utf8");
  });

  test("roster focus cn highlights asia decor and labels", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
    await waitTraveltrustHeroSettled(page, 60_000);

    await page.evaluate(() => window.__ttHeroGlobeP1Probe?.setFocusedRegion?.("cn"));
    await expect(page.locator("#hero")).toHaveAttribute("data-tt-traveltrust-globe-focused-region", "cn", {
      timeout: 8_000,
    });
    await expect(page.locator('[data-tt-traveltrust-hero-p3-layer="1"]')).toHaveAttribute(
      "data-tt-traveltrust-hero-p3-corridor-active",
      "asia",
      { timeout: 8_000 },
    );
    await expect(page.locator('[data-tt-traveltrust-hero-p3-label-visible="1"]')).toHaveAttribute(
      "data-tt-traveltrust-hero-p3-label-visible",
      "1",
      { timeout: 8_000 },
    );

    await page.screenshot({ path: join(OUT_DIR, "02-hero-p3-focus-cn.png") });
  });
});
