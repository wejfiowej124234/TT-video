/**
 * FPC-100 B15 · Mobile 375px public corridor live scan (① local)
 * Horizontal overflow on consumer pages = P1 (96-13 / 96-16 · VP-01)
 *
 *   cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/l5-mobile-375-live-scan.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { gotoSmoke } from "./helpers/smoke-nav";

const VIEWPORT = { width: 375, height: 812 };
const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "l5-mobile-375-live-scan");
const OVERFLOW_TOLERANCE_PX = 1;

/** public_corridor_10 — five-main + auth + guide + merchant + legal */
const SCAN_ROUTES: { role: string; route: string; probe: string }[] = [
  { role: "traveler", route: "/", probe: "home" },
  { role: "traveler", route: "/traveltrust", probe: "traveltrust" },
  { role: "traveler", route: "/market", probe: "market" },
  { role: "traveler", route: "/did-rank", probe: "did-rank" },
  { role: "traveler", route: "/community", probe: "community" },
  { role: "traveler", route: "/auth/login", probe: "auth-login" },
  { role: "traveler", route: "/auth/register", probe: "auth-register" },
  { role: "guide", route: "/guide", probe: "guide" },
  { role: "merchant", route: "/provider/register", probe: "merchant" },
  { role: "traveler", route: "/terms", probe: "terms" },
];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => ({
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const overflowPx = Math.max(
    metrics.docScrollWidth - metrics.docClientWidth,
    metrics.bodyScrollWidth - metrics.docClientWidth,
  );
  expect(overflowPx).toBeLessThanOrEqual(OVERFLOW_TOLERANCE_PX);
  return { ...metrics, overflowPx };
}

test.describe("L5 Mobile 375 Live Scan @l5-mobile-375", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  for (const { role, route, probe } of SCAN_ROUTES) {
    test(`${role} · ${route} @375`, async ({ page }) => {
      await gotoSmoke(page, route);
      await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
      const main = page.locator("main, [role='main']").first();
      await expect(main).toBeVisible({ timeout: 20_000 });

      const layout = await assertNoHorizontalOverflow(page);

      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
      fs.appendFileSync(
        path.join(EVIDENCE_DIR, "scan-results.jsonl"),
        `${JSON.stringify({
          role,
          route,
          probe,
          viewport: VIEWPORT,
          ...layout,
          ok: layout.overflowPx <= OVERFLOW_TOLERANCE_PX,
        })}\n`,
        "utf8",
      );
    });
  }

  test("home submit FAB in viewport band after scroll @375", async ({ page }) => {
    await gotoSmoke(page, "/plan");
    const submit = page.locator("#landing-hero-form button[type='submit']");
    await expect(submit).toBeVisible();
    await submit.scrollIntoViewIfNeeded();
    const box = await submit.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.y).toBeLessThan(VIEWPORT.height);
      expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height + 120);
    }
  });

  test("write scan summary", async () => {
    const jsonl = path.join(EVIDENCE_DIR, "scan-results.jsonl");
    test.skip(!fs.existsSync(jsonl), "no prior scan results");
    const lines = fs.readFileSync(jsonl, "utf8").trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(10);
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "scan-summary.json"),
      JSON.stringify(
        {
          schema: "traveltrust_l5_mobile_375_live_scan_summary.v1",
          viewport: VIEWPORT,
          routesScanned: lines.length,
          recordedUtc: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  });
});
