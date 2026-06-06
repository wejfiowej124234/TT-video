/**
 * ① 本地 · DOM 合成审计（`?tt_dom_compositor_audit=1`）
 * cd frontend && npx playwright test --config=playwright.scene-debug.probe.config.ts traveltrust-dom-compositor-audit
 */
import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { waitTraveltrustHeroSettled } from "./helpers/stabilizeTraveltrustVisual";

test("tt_dom_compositor_audit · elementsFromPoint + fixed z>0", async ({ page }) => {
  test.setTimeout(300_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/traveltrust?tt_dom_compositor_audit=1", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-tt-traveltrust-network-page="1"]', { timeout: 240_000 });
  await waitTraveltrustHeroSettled(page, 60_000);

  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __ttDomCompositorAudit?: { dump: () => unknown } }).__ttDomCompositorAudit
        ?.dump === "function",
    { timeout: 90_000 },
  );

  const report = await page.evaluate(() => {
    const api = (window as unknown as { __ttDomCompositorAudit?: { dump: () => unknown } }).__ttDomCompositorAudit;
    return api?.dump() ?? null;
  });

  const outDir = join(process.cwd(), "evidence/GO_local_hero_globe_a_closure");
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, "dom-compositor-audit.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const summary = report as {
    probes?: Array<{ point: { id: string }; hits: Array<{ depth: number; selector: string; flags: string[] }> }>;
    fixedZIndexPositive?: Array<{ zIndex: number; selector: string; flags: string[] }>;
    suspects?: Array<{ selector: string; reason: string[] }>;
  };

  console.log("\n=== TT dom compositor audit (saved:", jsonPath, ") ===\n");
  for (const probe of summary.probes ?? []) {
    console.log(`\n--- probe ${probe.point.id} ---`);
    for (const h of probe.hits ?? []) {
      console.log(
        `  [${h.depth}] ${h.selector}`,
        h.flags.length ? `| ${h.flags.join(" ")}` : "",
      );
    }
  }
  console.log("\n--- fixed z-index > 0 (top 25) ---");
  for (const n of (summary.fixedZIndexPositive ?? []).slice(0, 25)) {
    console.log(`  z=${n.zIndex} ${n.selector}`, n.flags.length ? `| ${n.flags.join(" ")}` : "");
  }
  console.log("\n--- page-cinematic-3d compositor children ---");
  for (const n of (summary as { cinematicLayerCompositor?: Array<{ zIndex: number; selector: string; flags: string[]; position: string }> }).cinematicLayerCompositor ?? []) {
    console.log(`  z=${n.zIndex} ${n.position} ${n.selector} | ${n.flags.join(" ")}`);
  }
  console.log("\n--- compositor suspects (top 30) ---");
  for (const s of (summary.suspects ?? []).slice(0, 30)) {
    console.log(`  ${s.selector} | ${s.reason.join(" ")}`);
  }

  test.info().attach("dom-compositor-audit.json", {
    path: jsonPath,
    contentType: "application/json",
  });

  expect(report).not.toBeNull();
  expect((summary.probes ?? []).length).toBeGreaterThan(0);
  expect((summary.fixedZIndexPositive ?? []).length).toBeGreaterThan(0);
});
