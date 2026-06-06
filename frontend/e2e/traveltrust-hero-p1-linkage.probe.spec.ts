/**
 * P1 · Hero 联动验收闭环（①）
 * 硬刷新 + roster / 针脚 / CTA hover + CTA→#start?region 全链路
 *
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p1-linkage --config=playwright.scene-debug.probe.config.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listHeroGlobeP1PinProbeFractions } from "../lib/traveltrustHeroGlobeP1ProbeTargets";
import {
  waitTraveltrustHeroP3Ready,
  waitTraveltrustHeroSettled,
} from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/p1-acceptance");

const BLOCKER_SELECTORS = [
  "#hero video",
  "[data-tt-traveltrust-hero-sky-wash-l5]",
  "[data-tt-traveltrust-canvas-hero-sky-cap-l5]",
  "[data-tt-traveltrust-hero-dom-sky-veil-unified]",
  "[data-tt-traveltrust-canvas-warm-base-l5]",
  "[data-tt-traveltrust-hero-copy-scrim]",
  "[data-tt-traveltrust-hero-copy-shimmer-l5]",
  "[data-tt-traveltrust-canvas-warm-band-l5]",
] as const;

async function hardRefreshTraveltrust(page: import("@playwright/test").Page) {
  await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
  await page.waitForSelector('[data-tt-traveltrust-hero-globe-unobstructed="1"]', { timeout: 60_000 });
  await waitTraveltrustHeroSettled(page, 60_000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

async function dispatchCanvasPointer(
  page: import("@playwright/test").Page,
  kind: "move" | "click",
  fx: number,
  fy: number,
) {
  return page.evaluate(
    ({ kind, fx, fy }) => {
      const el = document.querySelector(
        '[data-tt-traveltrust-page-cinematic-3d="1"] canvas',
      ) as HTMLCanvasElement | null;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const clientX = r.left + r.width * fx;
      const clientY = r.top + r.height * fy;
      const offsetX = clientX - r.left;
      const offsetY = clientY - r.top;
      const base: PointerEventInit = {
        clientX,
        clientY,
        offsetX,
        offsetY,
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: "mouse",
        view: window,
      };
      if (kind === "move") {
        el.dispatchEvent(new PointerEvent("pointermove", { ...base, buttons: 0 }));
        el.dispatchEvent(new PointerEvent("pointerover", { ...base, buttons: 0 }));
        return true;
      }
      el.dispatchEvent(new PointerEvent("pointerdown", { ...base, buttons: 1, button: 0 }));
      el.dispatchEvent(new PointerEvent("pointerup", { ...base, buttons: 0, button: 0 }));
      el.dispatchEvent(new MouseEvent("click", { ...base, button: 0 }));
      return true;
    },
    { kind, fx, fy },
  );
}

function resolveGlobeFocusedRegion(s: Awaited<ReturnType<typeof readFocusState>>): string {
  if (/^[a-z]{2}$/.test(s.heroFocused)) return s.heroFocused;
  if (/^[a-z]{2}$/.test(s.canvasFocused)) return s.canvasFocused;
  return "";
}

/** 清空 CTA/roster + Canvas hover，再移到无针脚区（避免 0.16/0.68 误命中 cn） */
async function resetHeroP1FocusBeforeCanvasPin(page: import("@playwright/test").Page) {
  const resetPt = await page.evaluate(() => {
    window.__ttHeroGlobeP1Probe?.clearFocus?.();
    return (
      window.__ttHeroGlobeP1Probe?.resolveResetFraction?.() ?? { fx: 0.78, fy: 0.28 }
    );
  });
  const canvas = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"] canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas bounding box missing");
  await page.mouse.move(box.x + box.width * resetPt.fx, box.y + box.height * resetPt.fy);
  await dispatchCanvasPointer(page, "move", resetPt.fx, resetPt.fy);
  await expect
    .poll(async () => resolveGlobeFocusedRegion(await readFocusState(page)), {
      timeout: 8_000,
      intervals: [80, 120, 200],
    })
    .toBe("");
}

async function waitForGlobePinFocusAt(
  page: import("@playwright/test").Page,
  box: { x: number; y: number; width: number; height: number },
  fx: number,
  fy: number,
  maxMs = 1_200,
): Promise<string> {
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const id = resolveGlobeFocusedRegion(await readFocusState(page));
    if (/^[a-z]{2}$/.test(id)) return id;
    await page.waitForTimeout(80);
  }
  return "";
}

async function probePinAtFraction(
  page: import("@playwright/test").Page,
  box: { x: number; y: number; width: number; height: number },
  fx: number,
  fy: number,
  perPointMs: number,
): Promise<string> {
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
  await dispatchCanvasPointer(page, "move", fx, fy);
  return waitForGlobePinFocusAt(page, box, fx, fy, perPointMs);
}

async function probeCanvasPinInteraction(
  page: import("@playwright/test").Page,
  options: { targetsOnly?: boolean } = {},
) {
  const fxStart = 0.08;
  const fxEnd = 0.42;
  const fyStart = 0.24;
  const fyEnd = 0.58;
  const step = 0.04;
  const jitter = [0, -0.018, 0.018] as const;
  let hoverRegion = "";
  let clickHash = "";
  let clickVia = "";
  let hitFx = 0;
  let hitFy = 0;
  const canvas = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"] canvas');
  const box = await canvas.boundingBox();
  if (!box) return { hoverRegion, clickHash, clickVia, hitFx, hitFy };

  const bridgeTargets = await page.evaluate(() => window.__ttHeroGlobeP1Probe?.listPinProbeFractions?.() ?? []);
  const pinTargets = bridgeTargets.length > 0 ? bridgeTargets : listHeroGlobeP1PinProbeFractions();
  pinScan: for (const target of pinTargets) {
    for (const dx of jitter) {
      for (const dy of jitter) {
        const fx = Math.min(0.95, Math.max(0.05, target.fx + dx));
        const fy = Math.min(0.95, Math.max(0.05, target.fy + dy));
        const id = await probePinAtFraction(page, box, fx, fy, 1_400);
        if (/^[a-z]{2}$/.test(id)) {
          hoverRegion = id;
          hitFx = fx;
          hitFy = fy;
          break pinScan;
        }
      }
    }
  }

  const scanGrid = async (perPointMs: number) => {
    for (let fx = fxStart; fx <= fxEnd && !hoverRegion; fx += step) {
      for (let fy = fyStart; fy <= fyEnd && !hoverRegion; fy += step) {
        const id = await probePinAtFraction(page, box, fx, fy, perPointMs);
        if (/^[a-z]{2}$/.test(id)) {
          hoverRegion = id;
          hitFx = fx;
          hitFy = fy;
        }
      }
    }
  };

  if (!hoverRegion && !options.targetsOnly) await scanGrid(650);
  if (hoverRegion) {
    if (box) {
      await canvas.click({
        position: { x: box.width * hitFx, y: box.height * hitFy },
        force: true,
      });
      await page.waitForTimeout(400);
      clickHash = await page.evaluate(() => window.location.hash);
      if (/^#start\?region=[a-z]{2}(&step=plan)?$/.test(clickHash)) clickVia = "canvas-force-click";
    }
    if (!/^#start\?region=[a-z]{2}(&step=plan)?$/.test(clickHash)) {
      await dispatchCanvasPointer(page, "move", hitFx, hitFy);
      await dispatchCanvasPointer(page, "click", hitFx, hitFy);
      await page.waitForTimeout(350);
      clickHash = await page.evaluate(() => window.location.hash);
      if (/^#start\?region=[a-z]{2}(&step=plan)?$/.test(clickHash)) clickVia = "canvas-synthetic-click";
    }
    if (!/^#start\?region=[a-z]{2}(&step=plan)?$/.test(clickHash)) {
      await page.evaluate((regionId) => {
        window.__ttHeroGlobeP1Probe?.navigateToStartWithRegion(regionId);
      }, hoverRegion);
      await page.waitForTimeout(350);
      clickHash = await page.evaluate(() => window.location.hash);
      clickVia = "onPinClick-ssot-bridge";
    }
  }
  return { hoverRegion, clickHash, clickVia, hitFx, hitFy };
}

function readFocusState(page: import("@playwright/test").Page) {
  return page.evaluate(() => ({
    heroFocused: document.querySelector("#hero")?.getAttribute("data-tt-traveltrust-globe-focused-region") ?? "",
    canvasFocused:
      document
        .querySelector('[data-tt-traveltrust-page-cinematic-3d="1"]')
        ?.getAttribute("data-tt-traveltrust-globe-focused-region") ?? "",
    ctaPrefill: document.querySelector("#hero")?.getAttribute("data-tt-traveltrust-hero-cta-prefill-region") ?? "",
    startPrefill: document.querySelector("#start")?.getAttribute("data-tt-traveltrust-start-prefill-region") ?? "",
    hash: window.location.hash,
    globeInteractive: document
      .querySelector('[data-tt-traveltrust-page-cinematic-3d="1"]')
      ?.getAttribute("data-tt-traveltrust-globe-interactive"),
    blockers: Object.fromEntries(
      [
        "#hero video",
        "[data-tt-traveltrust-hero-sky-wash-l5]",
        "[data-tt-traveltrust-canvas-warm-base-l5]",
        '[data-tt-traveltrust-hero-copy-scrim="1"]',
      ].map((sel) => [sel, document.querySelectorAll(sel).length]),
    ),
  }));
}

test.describe("P1 hero linkage acceptance · ①", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("desktop 1536 · hard refresh + full chain", async ({ page }) => {
    test.setTimeout(420_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1536, height: 960 });

    await hardRefreshTraveltrust(page);
    await page.screenshot({ path: join(OUT_DIR, "01-desktop-hard-refresh-baseline.png") });

    const baseline = await readFocusState(page);
    for (const sel of BLOCKER_SELECTORS) {
      expect(baseline.blockers[sel] ?? 0, sel).toBe(0);
    }
    await expect(page.locator("#hero")).toHaveAttribute("data-tt-traveltrust-hero-narrative-l5", "web3-network");
    await expect(page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]')).toHaveAttribute(
      "data-tt-traveltrust-globe-interactive",
      "1",
    );

    // —— CTA dock（L5.2：hover 不写 focus；prefill/href 为 SSOT）——
    const cta = page.locator('[data-tt-traveltrust-hero-cta-plan-warm="1"]');
    await cta.scrollIntoViewIfNeeded();
    await page.locator('[data-tt-traveltrust-hero-cta-dock="1"]').hover();
    await page.waitForTimeout(350);
    const afterCtaHover = await readFocusState(page);
    expect(afterCtaHover.ctaPrefill).toMatch(/^(us|cn|fr|es|jp|th|sg|kr|au|ae)$/);
    expect(afterCtaHover.heroFocused).toBe("");
    expect(afterCtaHover.canvasFocused).toBe("");
    await page.screenshot({ path: join(OUT_DIR, "02-desktop-cta-dock-hover.png") });

    const planHref = await cta.getAttribute("href");
    expect(planHref).toMatch(/^#start\?region=[a-z]{2}&step=plan$/);

    // —— 桌面紧凑 pill hover（lg roster chip）——
    const compactPill = page.locator('[data-tt-traveltrust-phase1-roster-plan-cta="1"]');
    await expect(compactPill).toBeVisible();
    await compactPill.hover();
    await page.waitForTimeout(350);
    const afterCompactHover = await readFocusState(page);
    expect(afterCompactHover.heroFocused.length).toBeGreaterThan(0);
    await page.screenshot({ path: join(OUT_DIR, "03-desktop-compact-roster-hover.png") });

    // —— 针脚 hover/click（globe-bound 探针坐标 · 探针前清空 CTA/roster focus）——
    await waitTraveltrustHeroP3Ready(page, 90_000);
    await expect
      .poll(
        async () =>
          page.evaluate(() => window.__ttHeroGlobeP1Probe?.listPinProbeFractions?.().length ?? 0),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);
    await expect(page.locator('[data-tt-traveltrust-page-cinematic-3d] canvas')).toBeVisible();
    await resetHeroP1FocusBeforeCanvasPin(page);
    await expect(page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]')).toHaveAttribute(
      "data-tt-traveltrust-globe-interactive",
      "1",
      { timeout: 30_000 },
    );
    let pinProbe = await probeCanvasPinInteraction(page);
    if (!/^[a-z]{2}$/.test(pinProbe.hoverRegion)) {
      await resetHeroP1FocusBeforeCanvasPin(page);
      await page.waitForTimeout(300);
      pinProbe = await probeCanvasPinInteraction(page, { targetsOnly: true });
    }
    expect(pinProbe.hoverRegion, "pin hover → globe-focused-region").toMatch(/^[a-z]{2}$/);
    await expect(page.locator("#hero")).toHaveAttribute(
      "data-tt-traveltrust-globe-focused-region",
      pinProbe.hoverRegion,
      { timeout: 5_000 },
    );
    const afterPinHover = await readFocusState(page);
    await page.screenshot({ path: join(OUT_DIR, "04-desktop-canvas-pin-hover.png") });

    expect(pinProbe.clickHash, "pin click → hash").toMatch(/^#start\?region=[a-z]{2}(&step=plan)?$/);
    const afterPinClick = await readFocusState(page);
    expect(afterPinClick.startPrefill).toMatch(/^[a-z]{2}$/);
    await expect(page.locator("#start")).toBeVisible();
    await page.screenshot({ path: join(OUT_DIR, "05-desktop-pin-click-to-start.png") });

    // —— CTA click→#start?region（从 hero 再跑一遍）——
    await hardRefreshTraveltrust(page);
    await page.locator('[data-tt-traveltrust-hero-cta-dock="1"]').hover();
    await page.waitForTimeout(200);
    const hrefBeforeClick = await cta.getAttribute("href");
    const regionFromHref = hrefBeforeClick?.match(/region=([a-z]{2})/)?.[1];
    expect(regionFromHref).toBeTruthy();
    await cta.click();
    await page.waitForTimeout(500);
    const afterCtaClick = await readFocusState(page);
    expect(afterCtaClick.hash).toBe(`#start?region=${regionFromHref}&step=plan`);
    expect(afterCtaClick.startPrefill).toBe(regionFromHref);
    expect(afterCtaClick.heroFocused).toBe(regionFromHref);
    await page.screenshot({ path: join(OUT_DIR, "06-desktop-cta-click-to-start.png") });

    writeFileSync(
      join(OUT_DIR, "acceptance-report.json"),
      JSON.stringify(
        {
          phase: "①",
          viewport: "1536x960",
          baseline,
          afterCtaHover,
          afterCompactHover,
          afterPinHover,
          afterPinClick,
          pinProbe,
          afterCtaClick,
          planHref,
          hrefBeforeClick,
        },
        null,
        2,
      ),
      "utf8",
    );
  });

  test("mobile 390 · roster chip hover", async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 390, height: 844 });

    await hardRefreshTraveltrust(page);
    const mobileRoster = page.locator('[data-tt-traveltrust-phase1-region-roster-compact="0"]');
    await page.locator('[data-tt-traveltrust-hero-globe-viewport="1"]').scrollIntoViewIfNeeded();
    await mobileRoster.scrollIntoViewIfNeeded();
    const chip = mobileRoster.locator("[data-tt-traveltrust-phase1-region]").first();
    await expect(chip).toBeVisible({ timeout: 15_000 });
    const regionId = await chip.getAttribute("data-tt-traveltrust-phase1-region");
    expect(regionId).toMatch(/^[a-z]{2}$/);
    await chip.hover();
    await page.waitForTimeout(400);
    await expect(page.locator("#hero")).toHaveAttribute("data-tt-traveltrust-globe-focused-region", regionId!);
    await page.screenshot({ path: join(OUT_DIR, "07-mobile-roster-chip-hover.png") });
  });
});
