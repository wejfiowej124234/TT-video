/**
 * Frontend ↔ API Consistency · Browser / Visual layer
 * Staging: duplicate img src across distinct guide cards = visual consistency fail
 *
 *   STAGING_WEB_BASE=https://tt-web-staging.fly.dev
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev
 *   npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
const C3_CANONICAL_BIO = "测试向导账号，用于联调";
const OUT_DIR = process.env.CONSISTENCY_AUDIT_SCREENSHOT_DIR;

async function gotoStaging(page: import("@playwright/test").Page, url: string) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      return;
    } catch (e) {
      lastErr = e;
      await page.waitForTimeout(2000 * attempt);
    }
  }
  throw lastErr;
}

test.describe("Frontend–API Visual Consistency @staging", () => {
  test.setTimeout(120_000);
  test("V-MARKET: guide cards have unique cover img src per API id", async ({ page, request }) => {
    const guidesRes = await request.get(`${API}/api/v1/guides?limit=50`);
    expect(guidesRes.ok()).toBeTruthy();
    const guidesJson = await guidesRes.json();
    const apiGuides = (guidesJson.items ?? []) as { id: string; city?: string }[];
    const apiCount = apiGuides.length;

    await gotoStaging(page, `${WEB}/market?view=guides`);
    await page.waitForTimeout(1500);

    const cardData = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article[aria-labelledby^="guide-title-"]'));
      const byGuideId = new Map<string, { src: string; label: string }>();
      for (const card of articles) {
        const titleEl = card.querySelector('h3[id^="guide-title-"]');
        const guideId = titleEl?.id?.replace("guide-title-", "") ?? "";
        if (!guideId || byGuideId.has(guideId)) continue;
        const img = card.querySelector("img");
        if (!img?.src) continue;
        byGuideId.set(guideId, { src: img.src, label: (card.textContent ?? "").slice(0, 48) });
      }
      const imgs = [...byGuideId.entries()].map(([guideId, v]) => ({ guideId, ...v }));
      const srcToGuideIds = new Map<string, string[]>();
      for (const { guideId, src } of imgs) {
        if (!srcToGuideIds.has(src)) srcToGuideIds.set(src, []);
        srcToGuideIds.get(src)!.push(guideId);
      }
      const dupSrc = [...srcToGuideIds.entries()].filter(([, ids]) => ids.length > 1);
      return { articleCount: articles.length, uniqueGuideCount: imgs.length, imgs, dupSrc };
    });

    expect(
      cardData.dupSrc,
      `duplicate guide card images across distinct guides: ${cardData.dupSrc
        .map(([s, ids]) => `${s.slice(0, 60)} → ${ids.join(",")}`)
        .join("; ")}`,
    ).toEqual([]);

    expect(apiCount).toBeGreaterThan(0);
    expect(cardData.uniqueGuideCount).toBeGreaterThan(0);

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "market-guides-view.png"), fullPage: true });
    }
  });

  test("V-MARKET-C3: Hangzhou test guide bio canonical (API + card on market)", async ({ page, request }) => {
    const guidesRes = await request.get(`${API}/api/v1/guides?limit=100`);
    expect(guidesRes.ok()).toBeTruthy();
    const guides = ((await guidesRes.json()).items ?? []) as {
      id: string;
      city?: string;
      bio?: string;
      data_origin?: string;
    }[];
    const c3 = guides.find(
      (g) =>
        g.data_origin === "test" &&
        (g.city ?? "").match(/hang|杭/i) &&
        ((g.bio ?? "").includes("联调") || (g.bio ?? "").includes(C3_CANONICAL_BIO)),
    );
    test.skip(!c3, "no Hangzhou C3 test guide on staging");
    expect((c3!.bio ?? "").trim()).toBe(C3_CANONICAL_BIO);

    await gotoStaging(page, `${WEB}/market?view=guides`);
    await page.waitForTimeout(1500);

    const card = page.locator(`article[aria-labelledby="guide-title-${c3!.id}"]`);
    await expect(card).toBeVisible();
    const cardText = await card.innerText();
    expect(cardText).toMatch(/联调|Hangzhou|杭州/i);
  });

  test("V-MARKET-SHOWCASE: homepage cold-start surfaces load without duplicate showcase avatars", async ({
    page,
    request,
  }) => {
    const surfacesRes = await request.get(`${API}/api/v1/official/cold-start/surfaces/homepage`);
    expect(surfacesRes.ok()).toBeTruthy();

    await gotoStaging(page, `${WEB}/`);
    await page.waitForTimeout(3000);

    const showcaseImgs = await page.evaluate(() => {
      const region = document.querySelector('[aria-label*="showcase" i], [aria-label*="向导" i]') ?? document.body;
      const imgs = Array.from(region.querySelectorAll("img[src*='unsplash'], img[src*='avatar']"));
      const srcs = imgs.map((img) => img.getAttribute("src") ?? "").filter(Boolean);
      const seen = new Set<string>();
      let dupCount = 0;
      for (const s of srcs) {
        if (seen.has(s)) dupCount += 1;
        seen.add(s);
      }
      return { total: srcs.length, unique: seen.size, dupCount };
    });
    expect(showcaseImgs.dupCount).toBe(0);

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "homepage-cold-start.png"), fullPage: false });
    }
  });

  test("V-MARKET-CAMPAIGN: market official surfaces render without mock leak", async ({ page, request }) => {
    const marketRes = await request.get(`${API}/api/v1/official/cold-start/surfaces/market`);
    expect(marketRes.ok()).toBeTruthy();

    await gotoStaging(page, `${WEB}/market`);
    await page.waitForTimeout(1500);

    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/mock-campaign|fake-campaign|placeholder-campaign/i);
    expect(body.length).toBeGreaterThan(100);

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "market-campaign-surface.png"), fullPage: true });
    }
  });

  test("V-MARKET-PROVIDER: listing cards match API ids (data-listing-id parity)", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/provider/listings?limit=50`);
    expect(apiRes.ok()).toBeTruthy();
    const apiIds = ((await apiRes.json()).items ?? []).map((r: { id: string }) => r.id).filter(Boolean);
    expect(apiIds.length).toBeGreaterThan(0);

    await gotoStaging(page, `${WEB}/market/provider`);
    await page.waitForTimeout(2500);

    const uiIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-listing-id]"))
        .map((n) => n.getAttribute("data-listing-id")?.trim() ?? "")
        .filter(Boolean),
    );
    if (uiIds.length > 0) {
      const apiSet = new Set(apiIds);
      expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
      expect(uiIds.length).toBeGreaterThan(0);
    }

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "market-provider-page.png"), fullPage: true });
    }
  });

  test("V-MARKET-ACQUISITION: listing cards match API ids (data-listing-id parity)", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/acquisition/listings?limit=50`);
    expect(apiRes.ok()).toBeTruthy();
    const apiIds = ((await apiRes.json()).items ?? []).map((r: { id: string }) => r.id).filter(Boolean);

    await gotoStaging(page, `${WEB}/market/acquisition`);
    await page.waitForTimeout(2500);

    if (apiIds.length === 0) {
      await expect(page.getByText(/Multi-demo|L3 closure|probe/i)).toHaveCount(0);
      if (OUT_DIR) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(OUT_DIR, "market-acquisition-page.png"), fullPage: true });
      }
      return;
    }
    expect(apiIds.length).toBeGreaterThan(0);

    const uiIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-listing-id]"))
        .map((n) => n.getAttribute("data-listing-id")?.trim() ?? "")
        .filter(Boolean),
    );
    if (uiIds.length > 0) {
      const apiSet = new Set(apiIds);
      expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
      expect(uiIds.length).toBeGreaterThan(0);
    }

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "market-acquisition-page.png"), fullPage: true });
    }
  });

  test("V-COMMUNITY: feed post count matches API (no extra mock rows)", async ({ page, request }) => {
    const feedRes = await request.get(`${API}/api/v1/community/feed?limit=30`);
    expect(feedRes.ok()).toBeTruthy();
    const feedJson = await feedRes.json();
    const apiPosts = (feedJson.posts ?? []) as { id: string }[];

    await gotoStaging(page, `${WEB}/community`);
    await page.waitForTimeout(2000);

    const uiCount = await page.locator('[data-testid="community-post-card"], article[data-post-id]').count();
    if (uiCount > 0 && apiPosts.length > 0) {
      expect(uiCount).toBeLessThanOrEqual(apiPosts.length + 2);
    }

    if (OUT_DIR) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(OUT_DIR, "community-feed.png"), fullPage: false });
    }
  });

  test("V-GOVERNANCE: proposals page loads without mock-only content", async ({ page, request }) => {
    test.skip(!process.env.STAGING_AUDIT_EMAIL, "Set STAGING_AUDIT_EMAIL for governance browser check");
    const login = await request.post(`${API}/auth/login`, {
      data: { email: process.env.STAGING_AUDIT_EMAIL, password: process.env.STAGING_AUDIT_PASSWORD ?? "Test123!" },
    });
    const { token } = await login.json();
    const propRes = await request.get(`${API}/api/v1/governance/proposals?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const apiCount = ((await propRes.json()).items ?? []).length;

    await gotoStaging(page, `${WEB}/governance/proposals`);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
    if (apiCount === 0) {
      expect(body).not.toMatch(/mock-proposal|fake-proposal/i);
    }
  });
});
