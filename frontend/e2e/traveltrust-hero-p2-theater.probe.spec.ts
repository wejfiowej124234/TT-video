/**
 * P2-C · #roles 剧场与 region/corridor/step 叙事联动（①）
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/p2c-acceptance");

function readTheaterState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const roles = document.querySelector("#roles");
    const travelerEnter = document.querySelector('[data-tt-traveltrust-role-enter-href]');
    return {
      hash: window.location.hash,
      corridor: roles?.getAttribute("data-tt-traveltrust-theater-corridor") ?? "",
      region: roles?.getAttribute("data-tt-traveltrust-theater-region") ?? "",
      stepId: roles?.getAttribute("data-tt-traveltrust-theater-step-id") ?? "",
      activeRole: roles?.getAttribute("data-tt-traveltrust-active-role-id") ?? "",
      defaultRole: roles?.getAttribute("data-tt-traveltrust-theater-default-role-id") ?? "",
      p2: roles?.getAttribute("data-tt-traveltrust-theater-p2-narrative") ?? "",
      enterHref: travelerEnter?.getAttribute("data-tt-traveltrust-role-enter-href") ?? "",
      guideSelected:
        roles?.querySelector('[data-tt-traveltrust-active-role-id]')?.getAttribute(
          "data-tt-traveltrust-active-role-id",
        ) === "guide" ||
        roles?.getAttribute("data-tt-traveltrust-active-role-id") === "guide",
    };
  });
}

test.describe("P2-C theater narrative binding · ①", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("from #start match syncs asia corridor and guide tab", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust#start?region=cn&step=match", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#start", { timeout: 60_000 });
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-p2-corridor-binding", "1", {
      timeout: 30_000,
    });
    await page.locator("#roles").scrollIntoViewIfNeeded();
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-theater-p2-narrative", "1", {
      timeout: 30_000,
    });
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-theater-step-id", "match", {
      timeout: 15_000,
    });
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-active-role-id", "guide", {
      timeout: 15_000,
    });

    const state = await readTheaterState(page);
    expect(state.p2).toBe("1");
    expect(state.corridor).toBe("asia");
    expect(state.region).toBe("cn");
    expect(state.stepId).toBe("match");
    expect(state.activeRole).toBe("guide");
    expect(state.defaultRole).toBe("guide");
    expect(state.enterHref).toMatch(/region=cn/);
    expect(state.enterHref).toMatch(/step=match/);

    await page.screenshot({ path: join(OUT_DIR, "01-theater-asia-match-guide.png") });
    writeFileSync(join(OUT_DIR, "p2c-theater-report.json"), JSON.stringify(state, null, 2), "utf8");
  });

  test("hero pin to start escrow then roles sync default role for corridor", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
    await waitTraveltrustHeroSettled(page, 60_000);

    await page.locator('[data-tt-traveltrust-hero-cta-plan-warm="1"]').click();
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-p2-corridor-binding", "1", {
      timeout: 30_000,
    });
    await page.evaluate(() => {
      const region =
        document.querySelector("#start")?.getAttribute("data-tt-traveltrust-start-prefill-region") ?? "cn";
      const select = window.__ttStartP2Probe?.selectStartStepByIndex;
      if (select) {
        select(2);
        return;
      }
      if (window.__ttHeroGlobeP1Probe?.writeStartHash) {
        window.__ttHeroGlobeP1Probe.writeStartHash({ region, step: "escrow" });
        return;
      }
      window.location.hash = `start?region=${region}&step=escrow`;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toMatch(/step=escrow/);

    await page.locator("#roles").scrollIntoViewIfNeeded();
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-theater-p2-narrative", "1", {
      timeout: 30_000,
    });
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-theater-step-id", "escrow", {
      timeout: 10_000,
    });
    const defaultRole = await page.locator("#roles").getAttribute("data-tt-traveltrust-theater-default-role-id");
    expect(defaultRole).toMatch(/^(traveler|guide|merchant|acquisition|region_steward)$/);
    await expect(page.locator("#roles")).toHaveAttribute("data-tt-traveltrust-active-role-id", defaultRole!, {
      timeout: 10_000,
    });

    await page.screenshot({ path: join(OUT_DIR, "02-theater-escrow-merchant.png") });
  });
});
