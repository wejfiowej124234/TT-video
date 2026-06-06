/**
 * ① 蓝块 DOM 溯源：elementsFromPoint + 首个 rgb(8,7,77) 节点 + display:none 验证
 * cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-blue-block-dom-origin --config=playwright.scene-debug.probe.config.ts
 */
import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

const OUT_DIR = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure/blue-block-dom-origin");

const TARGET_RGB = { r: 8, g: 7, b: 77 };
const TARGET_CSS = "rgb(8, 7, 77)";

function parseShotRgb(shotPath: string, x: number, y: number, dpr: number): string | null {
  try {
    const { PNG } = require("pngjs") as typeof import("pngjs");
    const png = PNG.sync.read(readFileSync(shotPath));
    const sx = Math.min(Math.floor(x * dpr), png.width - 1);
    const sy = Math.min(Math.floor(y * dpr), png.height - 1);
    const i = (png.width * sy + sx) << 2;
    return `rgb(${png.data[i]},${png.data[i + 1]},${png.data[i + 2]})`;
  } catch {
    return null;
  }
}

function rgbClose(r: number, g: number, b: number, tol = 4): boolean {
  return (
    Math.abs(r - TARGET_RGB.r) <= tol &&
    Math.abs(g - TARGET_RGB.g) <= tol &&
    Math.abs(b - TARGET_RGB.b) <= tol
  );
}

test("blue block · elementsFromPoint + first rgb(8,7,77) node + kill verify", async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(OUT_DIR, { recursive: true });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.goto("/traveltrust", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-network-page="1"]', { timeout: 240_000 });
  await page.waitForSelector('[data-tt-traveltrust-page-cinematic-3d="1"]', { timeout: 120_000 });
  await waitTraveltrustHeroSettled(page, 60_000);
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const baselineShot = join(OUT_DIR, "baseline.png");
  await page.screenshot({ path: baselineShot, fullPage: false });

  const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
  const vw = 1536;
  const vh = 960;

  /** 在截图上扫描蓝块，取最大连通区质心（规则矩形纯色块） */
  let probeCenter = { x: Math.floor(vw * 0.28), y: Math.floor(vh * 0.42), source: "fallback-28%-42%" };
  try {
    const { PNG } = require("pngjs") as typeof import("pngjs");
    const png = PNG.sync.read(readFileSync(baselineShot));
    const hits: { x: number; y: number }[] = [];
    const yMin = Math.floor(vh * 0.22 * dpr);
    const yMax = Math.floor(vh * 0.58 * dpr);
    const xMin = Math.floor(vw * 0.05 * dpr);
    const xMax = Math.floor(vw * 0.95 * dpr);
    for (let sy = yMin; sy < yMax; sy += 2) {
      for (let sx = xMin; sx < xMax; sx += 2) {
        const i = (png.width * sy + sx) << 2;
        const r = png.data[i];
        const g = png.data[i + 1];
        const b = png.data[i + 2];
        if (rgbClose(r, g, b, 3)) hits.push({ x: sx / dpr, y: sy / dpr });
      }
    }
    if (hits.length > 20) {
      const cx = hits.reduce((s, p) => s + p.x, 0) / hits.length;
      const cy = hits.reduce((s, p) => s + p.y, 0) / hits.length;
      probeCenter = { x: Math.round(cx), y: Math.round(cy), source: `scan-${hits.length}-hits` };
    }
  } catch (e) {
    console.warn("PNG scan skipped:", e);
  }

  const shotAtProbe = parseShotRgb(baselineShot, probeCenter.x, probeCenter.y, dpr);
  console.log(`\n=== Blue block probe center (${probeCenter.source}) ===`);
  console.log(`  point: (${probeCenter.x}, ${probeCenter.y})  screenshot pixel: ${shotAtProbe ?? "n/a"}`);

  type StackRow = {
    index: number;
    tag: string;
    id: string | null;
    className: string;
    dataAttrs: Record<string, string>;
    rect: string;
    zIndex: string;
    position: string;
    display: string;
    opacity: string;
    background: string;
    backgroundColor: string;
    backgroundImage: string;
    isExactTargetBg: boolean;
    selectorHint: string;
  };

  const domReport = await page.evaluate(
    ({ px, py, targetCss }) => {
      function collectDataAttrs(el: HTMLElement): Record<string, string> {
        const dt: Record<string, string> = {};
        for (const [k, v] of Object.entries(el.dataset)) {
          if (k.startsWith("tt") || k.startsWith("dataTt")) dt[k] = String(v);
        }
        return dt;
      }

      function selectorHint(el: HTMLElement): string {
        if (el.id) return `#${el.id}`;
        const dt = Object.entries(el.dataset)
          .filter(([k]) => k.startsWith("tt"))
          .map(([k, v]) => `[data-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${v}"]`)
          .slice(0, 2);
        if (dt.length) return dt.join("");
        const cls = el.className && typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "";
        return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
      }

      const stackEls = document.elementsFromPoint(px, py);
      const stack: StackRow[] = stackEls.map((el, index) => {
        if (!(el instanceof HTMLElement)) {
          return {
            index,
            tag: el.nodeName.toLowerCase(),
            id: null,
            className: "",
            dataAttrs: {},
            rect: "n/a",
            zIndex: "n/a",
            position: "n/a",
            display: "n/a",
            opacity: "n/a",
            background: "n/a",
            backgroundColor: "n/a",
            backgroundImage: "n/a",
            isExactTargetBg: false,
            selectorHint: el.nodeName.toLowerCase(),
          };
        }
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const bgc = cs.backgroundColor;
        return {
          index,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: typeof el.className === "string" ? el.className.slice(0, 240) : "",
          dataAttrs: collectDataAttrs(el),
          rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          zIndex: cs.zIndex,
          position: cs.position,
          display: cs.display,
          opacity: cs.opacity,
          background: cs.background,
          backgroundColor: bgc,
          backgroundImage: cs.backgroundImage,
          isExactTargetBg: bgc === targetCss || bgc.replace(/\s/g, "") === "rgb(8,7,77)",
          selectorHint: selectorHint(el),
        };
      });

      /** 全文档：computed backgroundColor 精确等于 rgb(8,7,77) */
      const exactBgNodes: {
        selectorHint: string;
        tag: string;
        id: string | null;
        dataAttrs: Record<string, string>;
        rect: string;
        backgroundColor: string;
        background: string;
        backgroundImage: string;
        zIndex: string;
        coversProbe: boolean;
      }[] = [];

      for (const el of document.querySelectorAll("*")) {
        if (!(el instanceof HTMLElement)) continue;
        const cs = getComputedStyle(el);
        const bgc = cs.backgroundColor;
        if (bgc !== targetCss && bgc.replace(/\s/g, "") !== "rgb(8,7,77)") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const coversProbe = px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
        exactBgNodes.push({
          selectorHint: selectorHint(el),
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          dataAttrs: collectDataAttrs(el),
          rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          backgroundColor: bgc,
          background: cs.background,
          backgroundImage: cs.backgroundImage,
          zIndex: cs.zIndex,
          coversProbe,
        });
      }

      const firstExactInStack = stack.find((row) => row.isExactTargetBg) ?? null;
      const firstExactCoversProbe =
        exactBgNodes.find((n) => n.coversProbe) ?? exactBgNodes[0] ?? null;

      return {
        probe: { x: px, y: py },
        stack,
        exactBgNodes,
        firstExactInStack,
        firstExactCoversProbe,
      };
    },
    { px: probeCenter.x, py: probeCenter.y, targetCss: TARGET_CSS },
  );

  console.log("\n=== elementsFromPoint stack (top → bottom) ===\n");
  for (const row of domReport.stack) {
    const mark = row.isExactTargetBg ? " <<< exact rgb(8,7,77)" : "";
    console.log(
      `[${row.index}] <${row.tag}${row.id ? `#${row.id}` : ""}> z=${row.zIndex} pos=${row.position} op=${row.opacity}${mark}`,
    );
    console.log(`     rect: ${row.rect}`);
    console.log(`     backgroundColor: ${row.backgroundColor}`);
    console.log(`     backgroundImage: ${row.backgroundImage?.slice(0, 160) || "(none)"}`);
    console.log(`     background: ${row.background?.slice(0, 200) || "(none)"}`);
    if (Object.keys(row.dataAttrs).length) console.log(`     data-*: ${JSON.stringify(row.dataAttrs)}`);
    if (row.className) console.log(`     class: ${row.className.slice(0, 120)}`);
  }

  console.log("\n=== document.querySelectorAll · computed backgroundColor === rgb(8,7,77) ===\n");
  if (domReport.exactBgNodes.length === 0) {
    console.log("  (none — pixel may be composited, not a single layer fill)");
  } else {
    for (const n of domReport.exactBgNodes) {
      console.log(
        `  ${n.coversProbe ? "[covers probe]" : "[off probe]"} ${n.selectorHint} ${n.rect} z=${n.zIndex}`,
      );
      console.log(`    backgroundColor: ${n.backgroundColor}`);
      console.log(`    backgroundImage: ${n.backgroundImage?.slice(0, 160)}`);
    }
  }

  const killTarget =
    domReport.firstExactInStack ??
    (domReport.firstExactCoversProbe
      ? {
          index: -1,
          tag: domReport.firstExactCoversProbe.tag,
          id: domReport.firstExactCoversProbe.id,
          selectorHint: domReport.firstExactCoversProbe.selectorHint,
          isExactTargetBg: true,
        }
      : null);

  let killResult: {
    killed: boolean;
    selectorUsed: string | null;
    beforeRgb: string | null;
    afterRgb: string | null;
    nodeHidden: boolean;
  } = {
    killed: false,
    selectorUsed: null,
    beforeRgb: shotAtProbe,
    afterRgb: null,
    nodeHidden: false,
  };

  const killSelector =
    killTarget && killTarget.id
      ? `#${killTarget.id}`
      : domReport.firstExactCoversProbe?.selectorHint ??
        (killTarget && "selectorHint" in killTarget ? killTarget.selectorHint : null);

  if (killSelector) {
    const selectorUsed = killSelector;

    console.log(`\n=== display:none kill · ${selectorUsed} ===\n`);

    const hidden = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!(el instanceof HTMLElement)) return { ok: false, reason: "not found" };
      el.style.setProperty("display", "none", "important");
      el.setAttribute("data-tt-blue-block-kill-probe", "1");
      return { ok: true, tag: el.tagName, id: el.id || null };
    }, selectorUsed);

    killResult.selectorUsed = selectorUsed;
    killResult.nodeHidden = hidden.ok;

    await page.waitForTimeout(350);
    const afterShot = join(OUT_DIR, "after-kill.png");
    await page.screenshot({ path: afterShot, fullPage: false });
    killResult.afterRgb = parseShotRgb(afterShot, probeCenter.x, probeCenter.y, dpr);
    killResult.killed =
      hidden.ok &&
      killResult.afterRgb != null &&
      !rgbClose(
        ...killResult.afterRgb
          .replace(/rgba?\(|\)/g, "")
          .split(",")
          .map((n) => Number(n.trim())) as [number, number, number],
        6,
      );

    console.log(`  hidden: ${hidden.ok}  before: ${killResult.beforeRgb}  after: ${killResult.afterRgb}`);
    console.log(`  blue removed at probe: ${killResult.killed ? "YES" : "NO"}`);

    await page.screenshot({ path: join(OUT_DIR, "after-kill-final.png"), fullPage: false });
  } else {
    console.log("\n=== No exact rgb(8,7,77) node — trying stack hit-test kill by largest rect ===\n");
    /** 无精确 bg 时：对 stack 中带非透明 background 的层逐个 kill（最多 8 层） */
    for (let i = 0; i < Math.min(domReport.stack.length, 8); i++) {
      const row = domReport.stack[i];
      if (row.tag === "html" || row.tag === "body") continue;
      const sel = row.id ? `#${row.id}` : null;
      if (!sel) continue;
      await page.evaluate((id) => {
        const el = document.getElementById(id.replace(/^#/, ""));
        if (el instanceof HTMLElement) el.style.removeProperty("display");
      }, sel);
      await page.evaluate((id) => {
        const el = document.getElementById(id.replace(/^#/, ""));
        if (el instanceof HTMLElement) el.style.setProperty("display", "none", "important");
      }, sel);
      await page.waitForTimeout(200);
      const tmp = join(OUT_DIR, `kill-try-${i}.png`);
      await page.screenshot({ path: tmp, fullPage: false });
      const rgb = parseShotRgb(tmp, probeCenter.x, probeCenter.y, dpr);
      console.log(`  kill #${row.id}: pixel ${rgb}`);
      await page.evaluate((id) => {
        const el = document.getElementById(id.replace(/^#/, ""));
        if (el instanceof HTMLElement) el.style.removeProperty("display");
      }, sel);
      if (rgb && !rgbClose(...rgb.replace(/rgba?\(|\)/g, "").split(",").map(Number) as [number, number, number], 8)) {
        killResult = { killed: true, selectorUsed: sel, beforeRgb: shotAtProbe, afterRgb: rgb, nodeHidden: true };
        await page.evaluate((id) => {
          const el = document.getElementById(id.replace(/^#/, ""));
          if (el instanceof HTMLElement) el.style.setProperty("display", "none", "important");
        }, sel);
        break;
      }
    }
  }

  const payload = {
    target: TARGET_CSS,
    probeCenter,
    shotAtProbe,
    domReport,
    killResult,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(join(OUT_DIR, "dom-origin-report.json"), JSON.stringify(payload, null, 2), "utf8");

  expect(domReport.stack.length).toBeGreaterThan(0);
});
