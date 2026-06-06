/**
 * ① 蓝带层逐个 kill · 运行时 computedStyle + 截图对比
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-layer-kill-audit --config=playwright.scene-debug.probe.config.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/layer-kill-audit");

type LayerAuditRow = {
  id: string;
  label: string;
  selector: string;
  found: boolean;
  note?: string;
  rect: { x: number; y: number; w: number; h: number } | null;
  opacity: string | null;
  zIndex: string | null;
  position: string | null;
  display: string | null;
  width: string | null;
  height: string | null;
  background: string | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
  maskImage: string | null;
  webkitMaskImage: string | null;
  inlineBackground?: string | null;
  inlineOpacity?: string | null;
};

const KILL_TARGETS_EXTRA = [
  {
    id: "hero-warm-backdrop",
    label: "underlay warm-backdrop",
    selector: '[data-tt-traveltrust-hero-warm-backdrop-l5]',
  },
  {
    id: "canvas-hero-sky-cap",
    label: "canvas hero sky cap",
    selector: '[data-tt-traveltrust-canvas-hero-sky-cap-l5]',
  },
  {
    id: "page-cinematic-3d",
    label: "entire fixed WebGL shell",
    selector: '[data-tt-traveltrust-page-cinematic-3d]',
  },
  {
    id: "hero-dom-sky-veil",
    label: "TT_HERO_DOM_SKY_VEIL_UNIFIED inside #hero",
    selector: '[data-tt-traveltrust-hero-dom-sky-veil-unified]',
  },
  {
    id: "hero-section",
    label: "entire #hero section",
    selector: "#hero",
  },
] as const;

const KILL_TARGETS = [
  {
    id: "hero-sky-wash",
    label: "HeroSkyWash",
    selector: '[data-tt-traveltrust-hero-sky-wash-l5]',
  },
  {
    id: "viewport-ink",
    label: "CinematicViewportInk (root)",
    selector: '[data-tt-traveltrust-cinematic-viewport-ink]',
  },
  {
    id: "equator-strip",
    label: "TT_HERO_EQUATOR_INK_STRIP_L5 (deprecated · 若未挂载则 skip)",
    selector: '[data-tt-traveltrust-hero-equator-ink-strip-l5]',
  },
  {
    id: "canvas-warm-band",
    label: "canvas-warm-band-l5",
    selector: '[data-tt-traveltrust-canvas-warm-band-l5]',
  },
  {
    id: "globe-underlay-decor",
    label: "TravelTrustHeroGlobeUnderlayDecor",
    selector: '[data-tt-traveltrust-hero-globe-underlay-decor-l5]',
  },
] as const;

const EXTRA_AUDIT_SELECTORS = [
  {
    id: "viewport-ink-left-wing",
    label: "viewport-ink wing left",
    selector: '[data-tt-traveltrust-cinematic-viewport-ink-wing="left"]',
  },
  {
    id: "viewport-ink-right-wing",
    label: "viewport-ink wing right",
    selector: '[data-tt-traveltrust-cinematic-viewport-ink-wing="right"]',
  },
  {
    id: "hero-warm-backdrop",
    label: "underlay warm-backdrop child",
    selector: '[data-tt-traveltrust-hero-warm-backdrop-l5]',
  },
  {
    id: "canvas-hero-sky-cap",
    label: "canvas hero sky cap",
    selector: '[data-tt-traveltrust-canvas-hero-sky-cap-l5]',
  },
  {
    id: "page-cinematic-3d",
    label: "fixed WebGL shell",
    selector: '[data-tt-traveltrust-page-cinematic-3d]',
  },
] as const;

test("layer-kill audit · computedStyle + display:none screenshots", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-network-page="1"]', { timeout: 240_000 });
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
      return d[3] > 200 && (d[0] + d[1] + d[2] > 12);
    },
    { timeout: 90_000 },
  );
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const auditPayload = await page.evaluate(
    ({ killTargets, extraSelectors }) => {
      function auditElement(
        el: Element | null,
        id: string,
        label: string,
        selector: string,
      ) {
        if (!el || !(el instanceof HTMLElement)) {
          return {
            id,
            label,
            selector,
            found: false,
            note: "not in DOM",
            rect: null,
            opacity: null,
            zIndex: null,
            position: null,
            display: null,
            width: null,
            height: null,
            background: null,
            backgroundColor: null,
            backgroundImage: null,
            maskImage: null,
            webkitMaskImage: null,
          };
        }
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const html = el;
        return {
          id,
          label,
          selector,
          found: true,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          },
          opacity: cs.opacity,
          zIndex: cs.zIndex,
          position: cs.position,
          display: cs.display,
          width: cs.width,
          height: cs.height,
          background: cs.background,
          backgroundColor: cs.backgroundColor,
          backgroundImage: cs.backgroundImage,
          maskImage: cs.maskImage,
          webkitMaskImage: cs.getPropertyValue("-webkit-mask-image") || null,
          inlineBackground: html.style.background || html.style.backgroundImage || null,
          inlineOpacity: html.style.opacity || null,
        };
      }
      const allSelectors = [...killTargets, ...extraSelectors];
      const layers = allSelectors.map((t) =>
        auditElement(document.querySelector(t.selector), t.id, t.label, t.selector),
      );
      return { layers, viewport: { w: innerWidth, h: innerHeight } };
    },
    { killTargets: KILL_TARGETS, extraSelectors: EXTRA_AUDIT_SELECTORS },
  );

  writeFileSync(join(OUT_DIR, "computed-audit.json"), JSON.stringify(auditPayload, null, 2), "utf8");

  console.log("\n=== Layer computed audit ===\n");
  for (const row of auditPayload.layers) {
    console.log(`\n--- ${row.id} (${row.found ? "FOUND" : "MISSING"}) ---`);
    if (!row.found) {
      console.log(`  selector: ${row.selector}`);
      continue;
    }
    console.log(`  rect: ${row.rect?.w}x${row.rect?.h} @ (${row.rect?.x},${row.rect?.y})`);
    console.log(`  z-index: ${row.zIndex}  position: ${row.position}  opacity: ${row.opacity}`);
    console.log(`  display: ${row.display}  size: ${row.width} x ${row.height}`);
    console.log(`  backgroundColor: ${row.backgroundColor}`);
    console.log(`  backgroundImage: ${row.backgroundImage?.slice(0, 200)}${(row.backgroundImage?.length ?? 0) > 200 ? "…" : ""}`);
    console.log(`  background (full): ${row.background}`);
    console.log(`  mask-image: ${row.maskImage || "(none)"}`);
    if (row.webkitMaskImage && row.webkitMaskImage !== "none") {
      console.log(`  -webkit-mask-image: ${row.webkitMaskImage}`);
    }
    if (row.inlineBackground) console.log(`  inline background: ${row.inlineBackground}`);
    if (row.inlineOpacity) console.log(`  inline opacity: ${row.inlineOpacity}`);
  }

  const TOP_SKY_PROBE = { x: 0.5, y: 0.14, label: "顶栏实心暖墨区（50%,14%）" };
  const GLOBE_RIM_PROBE = { x: 0.28, y: 0.42, label: "地球顶缘上沿（28%,42%）" };

  const sampleViewportPixels = async (
    tag: string,
    screenshotPath: string,
    probe = TOP_SKY_PROBE,
  ) => {
    const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
    const probes = await page.evaluate(({ fx, fy }) => {
      const px = (v: number, dim: number) => Math.floor(v * dim);
      const x = px(fx, innerWidth);
      const y = px(fy, innerHeight);
      const stack = document.elementsFromPoint(x, y).slice(0, 12).map((el) => {
        if (!(el instanceof HTMLElement)) return { tag: el.nodeName };
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const dt: Record<string, string> = {};
        for (const [k, v] of Object.entries(el.dataset)) {
          if (k.startsWith("tt")) dt[k] = String(v);
        }
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          data: dt,
          zIndex: cs.zIndex,
          opacity: cs.opacity,
          backgroundColor: cs.backgroundColor,
          backgroundImage: cs.backgroundImage?.slice(0, 120) ?? "",
          rect: `${Math.round(r.w)}x${Math.round(r.h)}`,
        };
      });
      return { x, y, stack };
    }, { fx: probe.x, fy: probe.y });

    let shotRgb: string | null = null;
    try {
      const { PNG } = await import("pngjs");
      const buf = await import("node:fs").then((fs) => fs.readFileSync(screenshotPath));
      const png = PNG.sync.read(buf);
      const sx = Math.min(Math.floor(probes.x * dpr), png.width - 1);
      const sy = Math.min(Math.floor(probes.y * dpr), png.height - 1);
      const i = (png.width * sy + sx) << 2;
      shotRgb = `rgb(${png.data[i]},${png.data[i + 1]},${png.data[i + 2]})`;
    } catch {
      shotRgb = null;
    }

    const webgl = await page.evaluate(({ fx, fy }) => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      const canvas = document.querySelector(
        '[data-tt-traveltrust-page-cinematic-3d] canvas',
      ) as HTMLCanvasElement | null;
      if (!ctx || !canvas || canvas.width < 2) return null;
      c.width = canvas.width;
      c.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
      const x = Math.floor(canvas.width * fx);
      const y = Math.floor(canvas.height * fy);
      const d = ctx.getImageData(x, y, 1, 1).data;
      return { x, y, rgb: `rgb(${d[0]},${d[1]},${d[2]})`, a: d[3] / 255 };
    }, { fx: probe.x, fy: probe.y });

    return { tag, probe: probe.label, probes, shotRgb, webgl };
  };

  const baselinePath = join(OUT_DIR, "00-baseline.png");
  await page.screenshot({ path: baselinePath, fullPage: false });

  expect(
    await page.evaluate(() => ({
      video: document.querySelectorAll("#hero video").length,
      skyWash: document.querySelectorAll("[data-tt-traveltrust-hero-sky-wash-l5]").length,
      skyCap: document.querySelectorAll("[data-tt-traveltrust-canvas-hero-sky-cap-l5]").length,
      veil: document.querySelectorAll("[data-tt-traveltrust-hero-dom-sky-veil-unified]").length,
      warmBase: document.querySelectorAll("[data-tt-traveltrust-canvas-warm-base-l5]").length,
      unobstructed: document.querySelector('[data-tt-traveltrust-page-cinematic-3d]')?.getAttribute(
        "data-tt-traveltrust-hero-globe-unobstructed",
      ),
      shellOpacity: getComputedStyle(
        document.querySelector('[data-tt-traveltrust-page-cinematic-3d]') as Element,
      ).opacity,
    })),
  ).toEqual({
    video: 0,
    skyWash: 0,
    skyCap: 0,
    veil: 0,
    warmBase: 0,
    unobstructed: "1",
    shellOpacity: "1",
  });

  const killResults: Array<{
    id: string;
    hidden: boolean;
    screenshot: string;
    viewport: Awaited<ReturnType<typeof sampleViewportPixels>>;
  }> = [];

  killResults.push({
    id: "baseline",
    hidden: false,
    screenshot: "00-baseline.png",
    viewport: await sampleViewportPixels("baseline", baselinePath),
  });

  const allKillTargets = [...KILL_TARGETS, ...KILL_TARGETS_EXTRA];
  for (const target of allKillTargets) {
    const hidden = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return false;
      el.setAttribute("data-tt-layer-kill", "1");
      el.style.setProperty("display", "none", "important");
      return true;
    }, target.selector);

    await page.waitForTimeout(400);
    const shotName = `kill-${target.id}.png`;
    await page.screenshot({ path: join(OUT_DIR, shotName), fullPage: false });
    const shotPath = join(OUT_DIR, shotName);
    killResults.push({
      id: target.id,
      hidden,
      screenshot: shotName,
      viewport: await sampleViewportPixels(target.id, shotPath),
    });

    await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return;
      el.style.removeProperty("display");
      el.removeAttribute("data-tt-layer-kill");
    }, target.selector);
    await page.waitForTimeout(200);
  }

  writeFileSync(
    join(OUT_DIR, "kill-matrix.json"),
    JSON.stringify({ audit: auditPayload, kills: killResults }, null, 2),
    "utf8",
  );

  console.log(`\n=== Kill matrix · ${TOP_SKY_PROBE.label} ===\n`);
  for (const k of killResults) {
    const top = k.viewport.probes.stack[0];
    console.log(
      `  ${k.id}: hidden=${k.hidden} shot=${k.viewport.shotRgb ?? "?"} webgl=${k.viewport.webgl?.rgb ?? "no canvas"} top=${top?.tag}${top?.data?.traveltrustHeroSkyWashL5 ? "[sky-wash]" : ""} z=${top?.zIndex}`,
    );
  }
  console.log(`\nArtifacts: ${OUT_DIR}\n`);

  const skyWash = auditPayload.layers.find((l) => l.id === "hero-sky-wash");
  /** unified `/traveltrust` 已卸固定天幕长条（蓝带改关 Hero video · 长条压球） */
  expect(skyWash?.found).toBe(false);
  expect(auditPayload.layers.find((l) => l.id === "page-cinematic-3d")?.found).toBe(true);

  const baselineTop = await sampleViewportPixels("baseline-top", baselinePath, TOP_SKY_PROBE);
  /** P0：首屏已卸 sky-wash；顶栏可为 WebGL 天幕而非实心暖墨 */
  expect(baselineTop.probes.stack.some((n) => n.data?.traveltrustHeroSkyWashL5 === "1")).toBe(false);
});
