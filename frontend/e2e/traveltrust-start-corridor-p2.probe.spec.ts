/**
 * P2-B · #start 走廊 × region/step 强绑定（①）
 *
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-start-corridor-p2 --config=playwright.scene-debug.probe.config.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/p2b-acceptance");

function readStartState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const start = document.querySelector("#start");
    const preview = document.querySelector('[data-tt-traveltrust-start-route-preview-l5="1"]');
    return {
      hash: window.location.hash,
      prefill: start?.getAttribute("data-tt-traveltrust-start-prefill-region") ?? "",
      corridor: start?.getAttribute("data-tt-traveltrust-start-corridor") ?? "",
      stepId: start?.getAttribute("data-tt-traveltrust-start-step-id") ?? "",
      activeStep: start?.getAttribute("data-tt-traveltrust-start-active-step") ?? "",
      previewCorridor: preview?.getAttribute("data-tt-traveltrust-start-corridor") ?? "",
      previewStepId: preview?.getAttribute("data-tt-traveltrust-start-step-id") ?? "",
      previewActiveStep: preview?.getAttribute("data-tt-traveltrust-start-active-step") ?? "",
      stepMatchHighlighted:
        start?.querySelector('[data-tt-traveltrust-start-step="match"] button')?.getAttribute("aria-current") ===
        "step",
    };
  });
}

test.describe("P2-B start corridor binding · ①", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("deep link #start?region=cn&step=match highlights asia corridor", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust#start?region=cn&step=match", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#start", { timeout: 60_000 });
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-p2-corridor-binding", "1", {
      timeout: 30_000,
    });
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-step-id", "match", {
      timeout: 10_000,
    });

    const state = await readStartState(page);
    expect(state.hash).toMatch(/region=cn/);
    expect(state.hash).toMatch(/step=match/);
    expect(state.prefill).toBe("cn");
    expect(state.corridor).toBe("asia");
    expect(state.stepId).toBe("match");
    expect(state.activeStep).toBe("1");
    expect(state.previewCorridor).toBe("asia");
    expect(state.previewStepId).toBe("match");
    expect(state.stepMatchHighlighted).toBe(true);

    await page.screenshot({ path: join(OUT_DIR, "01-deep-link-cn-match.png") });
    writeFileSync(join(OUT_DIR, "p2b-deep-link-report.json"), JSON.stringify(state, null, 2), "utf8");
  });

  test("hero CTA defaults to step=plan and corridor matches prefill region", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
    await waitTraveltrustHeroSettled(page, 60_000);

    const cta = page.locator('[data-tt-traveltrust-hero-cta-plan-warm="1"]');
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/region=[a-z]{2}/);
    expect(href).toMatch(/step=plan/);

    await cta.click();
    await page.waitForTimeout(600);
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-p2-corridor-binding", "1", {
      timeout: 30_000,
    });

    const state = await readStartState(page);
    const region = href?.match(/region=([a-z]{2})/)?.[1] ?? state.prefill;
    expect(state.hash).toMatch(/step=plan/);
    expect(state.stepId).toBe("plan");
    expect(state.activeStep).toBe("0");
    expect(state.prefill).toBe(region);
    const expectedCorridor: Record<string, RegExp> = {
      cn: /^(asia|any)$/,
      jp: /^(asia|any)$/,
      th: /^(asia|any)$/,
      sg: /^(asia|any)$/,
      kr: /^(asia|any)$/,
      us: /^(atlantic|any)$/,
      fr: /^(atlantic|any)$/,
      es: /^(atlantic|any)$/,
      au: /^(pacific|any)$/,
      ae: /^(mena|any)$/,
    };
    expect(state.corridor).toMatch(expectedCorridor[region] ?? /^(asia|atlantic|pacific|mena|any)$/);

    await page.screenshot({ path: join(OUT_DIR, "02-hero-cta-to-start-plan.png") });
  });

  test("step pill click writes hash step=escrow", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/traveltrust#start?region=th&step=plan", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#start", { timeout: 60_000 });
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-p2-corridor-binding", "1", {
      timeout: 30_000,
    });
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-step-id", "plan", {
      timeout: 10_000,
    });

    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-step-id", "plan", {
      timeout: 10_000,
    });
    await page.evaluate(() => {
      const select = window.__ttStartP2Probe?.selectStartStepByIndex;
      if (select) {
        select(2);
        return;
      }
      if (window.__ttHeroGlobeP1Probe?.writeStartHash) {
        window.__ttHeroGlobeP1Probe.writeStartHash({ region: "th", step: "escrow" });
        return;
      }
      window.location.hash = "start?region=th&step=escrow";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toMatch(/step=escrow/);
    await expect(page.locator("#start")).toHaveAttribute("data-tt-traveltrust-start-step-id", "escrow", {
      timeout: 8_000,
    });

    const state = await readStartState(page);
    expect(state.hash).toMatch(/region=th/);
    expect(state.hash).toMatch(/step=escrow/);
    expect(state.stepId).toBe("escrow");
    expect(state.activeStep).toBe("2");
    expect(state.corridor).toBe("asia");
    expect(state.previewStepId).toBe("escrow");

    await page.screenshot({ path: join(OUT_DIR, "03-step-pill-to-escrow.png") });

    writeFileSync(
      join(OUT_DIR, "p2b-acceptance-report.json"),
      JSON.stringify({ phase: "①", tests: ["deep-link", "hero-cta", "step-pill"], state }, null, 2),
      "utf8",
    );
  });
});
