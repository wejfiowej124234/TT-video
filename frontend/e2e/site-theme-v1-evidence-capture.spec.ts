/**
 * TT-PH1-213 / §6.2 · 全站主题 V1 POST 目视（① 机采旁证）
 * 产出：evidence/GO_local_site_theme_v1/POST-screenshots/<slug>/desktop-1280x800.png
 *
 * 运行（须 dev :3012 已就绪）：
 *   cd frontend && npm run e2e:site-theme-v1-capture
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

import { gotoSmoke } from "./helpers/smoke-nav";

const OUT_ROOT = join(process.cwd(), "evidence", "GO_local_site_theme_v1", "POST-screenshots");

const ROUTES: { slug: string; path: string; ready: string }[] = [
  { slug: "home", path: "/", ready: '[data-tt-home-first-task="plan"], main' },
  { slug: "market", path: "/market", ready: "main" },
  { slug: "market-provider", path: "/market/provider", ready: "main" },
  { slug: "market-acquisition", path: "/market/acquisition", ready: "main" },
  { slug: "did-rank", path: "/did-rank", ready: "main" },
  { slug: "community", path: "/community", ready: "main, [data-testid=community-feed-first-post]" },
  { slug: "explore", path: "/community/explore", ready: "main" },
  { slug: "friends", path: "/community/friends", ready: "main" },
  { slug: "messages", path: "/community/messages", ready: "main" },
  { slug: "me", path: "/community/me", ready: "main" },
  { slug: "feedback", path: "/community/feedback", ready: "main" },
  { slug: "tt", path: "/community/tt", ready: "main" },
];

test.describe("Site theme V1 POST screenshots (§2.4)", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_ROOT, { recursive: true });
  });

  test("desktop 1280×800 per route", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const { slug, path, ready } of ROUTES) {
      const dir = join(OUT_ROOT, slug);
      mkdirSync(dir, { recursive: true });
      await gotoSmoke(page, path);
      await expect(page.locator(ready).first()).toBeVisible({ timeout: 90_000 });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(dir, "desktop-1280x800.png"),
        fullPage: false,
      });
    }
  });

  /** §3.2.9 G9 · Q3/Q6 移动子集（D6 起草 / D10 闭卷） */
  test("mobile 390×844 · home market community did-rank", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });

    const mobileSlugs = ["home", "market", "did-rank", "community"] as const;
    for (const slug of mobileSlugs) {
      const route = ROUTES.find((r) => r.slug === slug);
      if (!route) continue;
      const dir = join(OUT_ROOT, slug);
      mkdirSync(dir, { recursive: true });
      await gotoSmoke(page, route.path);
      await expect(page.locator(route.ready).first()).toBeVisible({ timeout: 45_000 });
      await page.waitForTimeout(600);
      await page.screenshot({
        path: join(dir, "mobile-390x844.png"),
        fullPage: false,
      });
    }
  });
});
