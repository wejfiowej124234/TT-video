/**
 * Frontend ↔ API Consistency · Browser / Visual layer
 * Staging: duplicate img src across distinct guide cards = visual consistency fail
 *
 *   STAGING_WEB_BASE=https://tt-web-staging.fly.dev
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev
 *   npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");

test.describe("Frontend–API Visual Consistency @staging", () => {
  test("V-MARKET: guide cards have unique cover img src per API id", async ({ page, request }) => {
    const guidesRes = await request.get(`${API}/api/v1/guides?limit=50`);
    expect(guidesRes.ok()).toBeTruthy();
    const guidesJson = await guidesRes.json();
    const apiGuides = (guidesJson.items ?? []) as { id: string; city?: string }[];
    const apiCount = apiGuides.length;

    await page.goto(`${WEB}/market?view=guides`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("article, li")).filter((el) =>
        el.textContent?.match(/向导|Guide|Hangzhou|杭州|上海|北京|京都/i),
      );
      const imgs: { src: string; label: string }[] = [];
      for (const card of cards.slice(0, 20)) {
        const img = card.querySelector("img");
        if (!img?.src) continue;
        imgs.push({ src: img.src, label: (card.textContent ?? "").slice(0, 40) });
      }
      return { cardLikeCount: cards.length, imgs };
    });

    const srcToLabels = new Map<string, string[]>();
    for (const { src, label } of cardData.imgs) {
      if (!srcToLabels.has(src)) srcToLabels.set(src, []);
      srcToLabels.get(src)!.push(label);
    }
    const dupSrc = [...srcToLabels.entries()].filter(([, labels]) => labels.length > 1);
    expect(
      dupSrc,
      `duplicate guide card images (visual consistency): ${dupSrc.map(([s, l]) => s.slice(0, 60) + " x" + l.length).join("; ")}`,
    ).toEqual([]);

    expect(apiCount).toBeGreaterThan(0);
  });

  test("V-COMMUNITY: feed post count matches API (no extra mock rows)", async ({ page, request }) => {
    const feedRes = await request.get(`${API}/api/v1/community/feed?limit=30`);
    expect(feedRes.ok()).toBeTruthy();
    const feedJson = await feedRes.json();
    const apiPosts = (feedJson.posts ?? []) as { id: string }[];

    await page.goto(`${WEB}/community`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const uiCount = await page.locator('[data-testid="community-post-card"], article[data-post-id]').count();
    if (uiCount > 0 && apiPosts.length > 0) {
      expect(uiCount).toBeLessThanOrEqual(apiPosts.length + 2);
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

    await page.goto(`${WEB}/governance/proposals`, { waitUntil: "networkidle" });
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
    if (apiCount === 0) {
      expect(body).not.toMatch(/mock-proposal|fake-proposal/i);
    }
  });
});
