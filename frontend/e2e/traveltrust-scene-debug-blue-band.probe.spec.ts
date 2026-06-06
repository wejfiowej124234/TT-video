/**
 * ① 本地 · `?tt_scene_debug=1` 蓝带 step 实测（非回归门禁）
 * 运行：cd frontend && npx playwright test traveltrust-scene-debug-blue-band.probe.spec.ts --project=chromium
 */
import { test } from "@playwright/test";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

type StepMetrics = {
  step: number;
  blueExcess: number;
  meanRgb: [number, number, number];
  sampleCount: number;
  viewportBlueExcess?: number;
  stack?: Awaited<ReturnType<typeof probeUpperViewportStack>>;
};

async function sampleCanvasUpperSky(page: import("@playwright/test").Page): Promise<StepMetrics["meanRgb"] & { blueExcess: number; sampleCount: number }> {
  return page.evaluate(async () => {
    const root = document.querySelector('[data-tt-traveltrust-page-cinematic-3d="1"]');
    const canvas = root?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas || canvas.width < 8 || canvas.height < 8) {
      return { blueExcess: 0, meanRgb: [0, 0, 0] as [number, number, number], sampleCount: 0 };
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const ctx = copy.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { blueExcess: 0, meanRgb: [0, 0, 0] as [number, number, number], sampleCount: 0 };
    ctx.drawImage(canvas, 0, 0);

    const rows = [0.12, 0.22, 0.32, 0.42];
    const cols = [0.2, 0.35, 0.5, 0.65, 0.8];
    let n = 0;
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let blueExcessSum = 0;

    for (const row of rows) {
      const y = Math.min(copy.height - 1, Math.max(0, Math.floor(copy.height * row)));
      for (const col of cols) {
        const x = Math.min(copy.width - 1, Math.max(0, Math.floor(copy.width * col)));
        const { data } = ctx.getImageData(x, y, 1, 1);
        const r = data[0] ?? 0;
        const g = data[1] ?? 0;
        const b = data[2] ?? 0;
        rSum += r;
        gSum += g;
        bSum += b;
        blueExcessSum += b - (r + g) * 0.5;
        n += 1;
      }
    }

    if (n === 0) return { blueExcess: 0, meanRgb: [0, 0, 0] as [number, number, number], sampleCount: 0 };
    return {
      blueExcess: blueExcessSum / n,
      meanRgb: [rSum / n, gSum / n, bSum / n] as [number, number, number],
      sampleCount: n,
    };
  });
}

async function probeUpperViewportStack(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const pts = [
      { x: 0.5, y: 0.22, label: "center-upper" },
      { x: 0.28, y: 0.32, label: "left-mid" },
      { x: 0.5, y: 0.48, label: "center-mid" },
    ];
    const rows: Array<{
      label: string;
      topHit: string;
      blueExcess: number;
      chain: string[];
    }> = [];

    for (const pt of pts) {
      const x = Math.floor(window.innerWidth * pt.x);
      const y = Math.floor(window.innerHeight * pt.y);
      const chain = document.elementsFromPoint(x, y).slice(0, 8).map((el) => {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const dt =
          (el as HTMLElement).dataset?.ttTraveltrustPageCinematic3d != null
            ? '[data-tt-traveltrust-page-cinematic-3d]'
            : (el as HTMLElement).dataset?.ttTraveltrustCanvasHeroSkyCapL5 != null
              ? "[data-tt-traveltrust-canvas-hero-sky-cap-l5]"
              : (el as HTMLElement).dataset?.ttTraveltrustHeroDomSkyVeilUnified != null
                ? "[data-tt-traveltrust-hero-dom-sky-veil-unified]"
                : (el as HTMLElement).dataset?.ttTraveltrustHeroTopInkVeilL5 != null
                  ? "[data-tt-traveltrust-hero-top-ink-veil-l5]"
                  : "";
        return `${tag}${id}${dt}`;
      });
      const top = document.elementsFromPoint(x, y)[0] as HTMLElement | undefined;
      const bg = top ? getComputedStyle(top).backgroundColor : "transparent";
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const rgb = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
      const blueExcess = rgb[2] - (rgb[0] + rgb[1]) * 0.5;
      rows.push({ label: pt.label, topHit: chain[0] ?? "?", blueExcess, chain });
    }

    const canvas = document.querySelector(
      '[data-tt-traveltrust-page-cinematic-3d="1"] canvas',
    ) as HTMLCanvasElement | null;
    let canvasBlueExcess = 0;
    if (canvas && canvas.width > 0) {
      const copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      const ctx = copy.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
        const y = Math.floor(canvas.height * 0.28);
        const x = Math.floor(canvas.width * 0.5);
        const { data } = ctx.getImageData(x, y, 1, 1);
        canvasBlueExcess = (data[2] ?? 0) - ((data[0] ?? 0) + (data[1] ?? 0)) * 0.5;
      }
    }

    return { rows, canvasBlueExcess };
  });
}

test.describe.configure({ mode: "serial" });

test("tt_scene_debug setStep 0→5 · 记录蓝带首次消失的 step", async ({ page }) => {
  test.setTimeout(300_000);
  /** WebGL 在 `reduceMotion` 下不挂载（`TravelTrustPageCinematicCanvas` return null） */
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/traveltrust?tt_scene_debug=1", { waitUntil: "domcontentloaded" });

  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"] canvas', {
    timeout: 240_000,
  });

  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __ttSceneLayerDebug?: { setStep: (n: number) => number } })
        .__ttSceneLayerDebug?.setStep === "function",
    { timeout: 90_000 },
  );

  await waitTraveltrustHeroSettled(page, 60_000);
  await page.waitForTimeout(1200);

  const metrics: StepMetrics[] = [];

  for (let step = 0; step <= 5; step += 1) {
    await page.evaluate((n) => {
      const api = (window as unknown as { __ttSceneLayerDebug?: { setStep: (s: number) => number } })
        .__ttSceneLayerDebug;
      api?.setStep(n);
    }, step);
    const frameloop = await page.locator('[data-tt-traveltrust-page-cinematic-3d="1"]').getAttribute(
      "data-tt-traveltrust-page-cinematic-frameloop",
    );
    if (frameloop === "never") {
      await page.evaluate(() => {
        const el = document.querySelector('[data-tt-traveltrust-page-cinematic-3d="1"] canvas');
        el?.dispatchEvent(new Event("webglneedsupdate"));
      });
      await page.locator("#hero").scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
    }
    await page.waitForTimeout(600);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    const sample = await sampleCanvasUpperSky(page);
    const stack = await probeUpperViewportStack(page);
    metrics.push({
      step,
      ...sample,
      viewportBlueExcess: stack.rows[0]?.blueExcess ?? 0,
      stack,
    });
    const canvas = page.locator('[data-tt-traveltrust-page-cinematic-3d="1"] canvas');
    await canvas.screenshot({
      path: `evidence/GO_local_hero_globe_a_closure/scene-debug-canvas-step-${step}.png`,
    });
    await page.screenshot({
      path: `evidence/GO_local_hero_globe_a_closure/scene-debug-step-${step}.png`,
      fullPage: false,
    });
  }

  /** PNG 截图像素（与肉眼蓝块一致；优于 drawImage 读 WebGL 缓冲） */
  const pngRgbByStep: Record<number, [number, number, number]> = {};
  for (let step = 0; step <= 5; step += 1) {
    const pngPath = `evidence/GO_local_hero_globe_a_closure/scene-debug-step-${step}.png`;
    try {
      const { execSync } = await import("node:child_process");
      const out = execSync(
        `python -c "from PIL import Image; im=Image.open('${pngPath.replace(/\\/g, "/")}').convert('RGB'); w,h=im.size; print(*im.getpixel((w//2,h//5)))"`,
        { encoding: "utf8", cwd: process.cwd() },
      ).trim();
      const parts = out.split(/\s+/).map(Number);
      if (parts.length === 3) pngRgbByStep[step] = [parts[0], parts[1], parts[2]];
    } catch {
      /* PIL optional */
    }
  }

  const pngBlue = (rgb: [number, number, number]) => rgb[2] - (rgb[0] + rgb[1]) * 0.5;
  const step0Png = pngRgbByStep[0];
  const step0Blue = step0Png ? pngBlue(step0Png) : 0;
  const pngThreshold = Math.max(12, step0Blue * 0.45);
  let firstGonePng: number | null = null;
  for (let i = 1; i <= 5; i += 1) {
    const rgb = pngRgbByStep[i];
    if (!rgb || !step0Png) continue;
    if (pngBlue(rgb) < pngThreshold) {
      firstGonePng = i;
      break;
    }
  }
  const firstGoneStep = firstGonePng;

  const layerByStep = [
    "baseline (all layers)",
    "step1 warmSkyShell hidden",
    "step2 + fog/background hidden",
    "step3 + atmosphere hidden",
    "step4 + arcs hidden",
    "step5 + ocean/globe hidden",
  ];

  console.log("\n=== TT scene debug · upper-sky blueExcess (B - avg(R,G)) ===");
  if (step0Png) {
    console.log(
      `PNG step0 rgb=(${step0Png.join(",")}) blueExcess=${step0Blue.toFixed(1)} threshold=${pngThreshold.toFixed(1)}`,
    );
    for (let s = 0; s <= 5; s += 1) {
      const rgb = pngRgbByStep[s];
      if (rgb) console.log(`PNG step=${s} rgb=(${rgb.join(",")}) blueExcess=${pngBlue(rgb).toFixed(1)}`);
    }
  }
  for (const m of metrics) {
    const [r, g, b] = m.meanRgb;
    console.log(
      `step=${m.step} ${layerByStep[m.step] ?? "?"} | canvasBlueExcess=${m.blueExcess.toFixed(2)} | dom@${m.stack?.rows[0]?.label}=${(m.viewportBlueExcess ?? 0).toFixed(2)} top=${m.stack?.rows[0]?.topHit} | meanRgb=[${r.toFixed(1)},${g.toFixed(1)},${b.toFixed(1)}]`,
    );
    for (const row of m.stack?.rows ?? []) {
      console.log(`  · ${row.label} blueExcess=${row.blueExcess.toFixed(1)} chain=${row.chain.slice(0, 4).join(" < ")}`);
    }
  }
  console.log(
    firstGonePng == null
      ? "RESULT(PNG): 蓝块在 step1–5 均未消失 — 不得按 step 改 scene 层；请查 DOM/CSS（hero 叠层 / sky-cap / body）"
      : `RESULT(PNG): 蓝块首次消失 step=${firstGonePng} (${layerByStep[firstGonePng]}) — 仅允许改对应层`,
  );
  console.log(
    "Screenshots: evidence/.../scene-debug-canvas-step-{0..5}.png + scene-debug-step-{0..5}.png\n",
  );

  test.info().attach("scene-debug-metrics.json", {
    body: JSON.stringify(
      { step0Png, step0Blue, pngThreshold, firstGonePng, pngRgbByStep, metrics, layerByStep },
      null,
      2,
    ),
    contentType: "application/json",
  });

});
