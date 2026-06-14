/**
 * L5 Enterprise Reliability · A11Y Live Scan (163)
 * 五角色代表路由 · DOM 级 a11y 探针（① local · 需 dev server）
 *
 * 运行：cd frontend && npx playwright test e2e/l5-a11y-live-scan.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { gotoSmoke } from "./helpers/smoke-nav";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "l5-a11y-live-scan");

type ScanRoute = { role: string; route: string; probe: string };

const SCAN_ROUTES: ScanRoute[] = [
  { role: "traveler", route: "/", probe: "home" },
  { role: "traveler", route: "/market", probe: "market" },
  { role: "traveler", route: "/community", probe: "community" },
  { role: "guide", route: "/guide", probe: "guide" },
  { role: "merchant", route: "/provider/register", probe: "merchant" },
];

test.describe("L5 A11Y Live Scan @l5-a11y-live", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const { role, route, probe } of SCAN_ROUTES) {
    test(`${role} · ${route}`, async ({ page }) => {
      await gotoSmoke(page, route);
      await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
      const main = page.locator("main, [role='main']").first();
      await expect(main).toBeVisible({ timeout: 15_000 });

      const scan = page.locator(`[data-tt-l5-a11y-live-scan='${probe}']`);
      if (await scan.count()) {
        await expect(scan.first()).toBeVisible();
      }

      const alerts = page.locator("[role='alert'], [aria-live]");
      const alertCount = await alerts.count();

      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
      fs.appendFileSync(
        path.join(EVIDENCE_DIR, "scan-results.jsonl"),
        `${JSON.stringify({ role, route, probe, alertCount, ok: true })}\n`,
        "utf8",
      );
    });
  }

  test("write scan summary", async () => {
    const jsonl = path.join(EVIDENCE_DIR, "scan-results.jsonl");
    test.skip(!fs.existsSync(jsonl), "no prior scan results");
    const lines = fs.readFileSync(jsonl, "utf8").trim().split("\n").filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(5);
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "scan-summary.json"),
      JSON.stringify({ routesScanned: lines.length, recordedUtc: new Date().toISOString() }, null, 2),
      "utf8",
    );
  });
});
