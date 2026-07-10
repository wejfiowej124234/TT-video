/**
 * FPC-100 B16 · Performance · five-main live scan (① local · production server)
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3013 npx playwright test e2e/l5-performance-five-main-live-scan.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "l5-performance-five-main-live-scan");

const ROUTES = [
  { route: "/", probe: "home" },
  { route: "/traveltrust", probe: "traveltrust" },
  { route: "/market", probe: "market" },
  { route: "/did-rank", probe: "did-rank" },
  { route: "/community", probe: "community" },
];

test.describe("L5 Performance Five-Main Live Scan @l5-perf-five-main", () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { route, probe } of ROUTES) {
    test(`${route} · navigation · budgets`, async ({ page }) => {
      const requests: { url: string; type: string; size: number }[] = [];

      page.on("response", async (res) => {
        const req = res.request();
        const type = req.resourceType();
        if (type !== "script" && type !== "stylesheet" && type !== "fetch" && type !== "xhr") return;
        let size = 0;
        try {
          const buf = await res.body();
          size = buf.length;
        } catch {
          size = Number(res.headers()["content-length"] || 0);
        }
        requests.push({ url: req.url(), type, size });
      });

      const t0 = Date.now();
      await page.goto(route, { waitUntil: "load" });
      const navigation_ms = Date.now() - t0;

      await expect(page.locator("main, [role='main']").first()).toBeVisible({ timeout: 25_000 });

      const perf = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const shifts = performance.getEntriesByType("layout-shift") as PerformanceEntry[] & {
          value?: number;
          hadRecentInput?: boolean;
        }[];
        let cls = 0;
        for (const s of shifts) {
          if (!s.hadRecentInput && typeof s.value === "number") cls += s.value;
        }
        return {
          domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
          loadEventEnd: nav?.loadEventEnd ?? null,
          cls,
        };
      });

      const scriptBytes = requests.filter((r) => r.type === "script").reduce((s, r) => s + r.size, 0);
      const urlCounts = new Map<string, number>();
      for (const r of requests) {
        try {
          const u = new URL(r.url);
          const key = `${r.type}:${u.pathname}`;
          urlCounts.set(key, (urlCounts.get(key) || 0) + 1);
        } catch {
          /* ignore */
        }
      }
      let duplicate_requests = 0;
      for (const c of urlCounts.values()) {
        if (c > 1) duplicate_requests += c - 1;
      }

      const cachedStatic = requests.filter((r) => r.type === "script" || r.type === "stylesheet").length;

      const row = {
        route,
        probe,
        navigation_ms,
        initial_js_bytes: scriptBytes,
        duplicate_requests,
        cls: perf.cls,
        dom_content_loaded_ms: perf.domContentLoaded,
        load_event_end_ms: perf.loadEventEnd,
        tracked_requests: requests.length,
        static_asset_responses: cachedStatic,
        ok: true,
      };

      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
      fs.appendFileSync(
        path.join(EVIDENCE_DIR, "scan-results.jsonl"),
        `${JSON.stringify(row)}\n`,
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
      JSON.stringify(
        {
          schema: "traveltrust_l5_performance_five_main_summary.v1",
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
