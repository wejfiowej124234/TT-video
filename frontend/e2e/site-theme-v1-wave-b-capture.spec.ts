/**
 * TT-PH1-214/215 · 波次 B 目视（①）
 * 产出：evidence/GO_local_site_theme_v1/WAVE-B-screenshots/<slug>/desktop-1280x800.png
 *
 * 运行（须 dev :3012 已就绪）：
 *   cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-wave-b-capture
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { gotoSmoke } from "./helpers/smoke-nav";

const OUT_ROOT = join(
  process.cwd(),
  "evidence",
  "GO_local_site_theme_v1",
  "WAVE-B-screenshots",
);

const ROUTES: { slug: string; path: string; ready: string }[] = [
  { slug: "home", path: "/", ready: "main" },
  { slug: "traveltrust", path: "/traveltrust", ready: "main" },
  { slug: "guides", path: "/guides", ready: "main" },
  { slug: "auth-login", path: "/auth/login", ready: "main" },
  { slug: "help", path: "/help", ready: "main" },
];

test.describe("Site theme V1 wave B screenshots (§3)", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_ROOT, { recursive: true });
  });

  test("desktop 1280×800 · home / traveltrust / guides", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const { slug, path, ready } of ROUTES) {
      const dir = join(OUT_ROOT, slug);
      mkdirSync(dir, { recursive: true });
      await gotoSmoke(page, path);
      await expect(page.locator(ready).first()).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: join(dir, "desktop-1280x800.png"),
        fullPage: false,
      });
    }
  });
});
