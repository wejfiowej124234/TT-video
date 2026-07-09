/**
 * Business Domain Validation · Browser layer
 * Provider · Acquisition · Discover · Messages · Market (non-guide surfaces)
 *
 *   STAGING_WEB_BASE=https://tt-web-staging.fly.dev
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev
 */
import { test, expect } from "@playwright/test";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");

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

test.describe("Business Domain Validation @staging", () => {
  test.setTimeout(120_000);

  test("BDV-DISCOVER: market discover orders UI loads", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/discover/orders?limit=20`);
    expect(apiRes.ok()).toBeTruthy();
    const apiJson = await apiRes.json();
    const apiCount = (apiJson.items ?? apiJson.orders ?? []).length;

    await gotoStaging(page, `${WEB}/market?view=orders`);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(80);
    if (apiCount > 0) {
      expect(body).toMatch(/订单|Order|预算|天/i);
    }
  });

  test("BDV-PROVIDER: provider market subsite loads", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/provider/listings?limit=20`);
    expect(apiRes.ok()).toBeTruthy();
    const apiCount = (await apiRes.json()).items?.length ?? 0;

    await gotoStaging(page, `${WEB}/market?view=provider`);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(80);
    expect(body).not.toMatch(/mock-provider|fake-provider/i);
    if (apiCount > 0) {
      expect(body.length).toBeGreaterThan(150);
    }
  });

  test("BDV-ACQUISITION: acquisition subsite loads", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/acquisition/listings?limit=20`);
    expect(apiRes.ok()).toBeTruthy();
    const apiCount = (await apiRes.json()).items?.length ?? 0;

    await gotoStaging(page, `${WEB}/market/acquisition`);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(80);
    expect(body).not.toMatch(/mock-acquisition|fake-acquisition/i);
    if (apiCount > 0) {
      expect(body).toMatch(/收购|Acquisition|Trust/i);
    }
  });

  test("BDV-ITINERARY: landing itinerary section reachable", async ({ page }) => {
    await gotoStaging(page, `${WEB}/`);
    await page.waitForTimeout(2000);
    const hasItinerary = await page
      .locator('[data-tt-itinerary], [id*="itinerary"], text=/行程|Itinerary/i')
      .first()
      .isVisible()
      .catch(() => false);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(200);
    expect(hasItinerary || /行程|规划|Itinerary/i.test(body)).toBeTruthy();
  });

  test("BDV-MESSAGES: conversations page loads for authed user", async ({ page, request }) => {
    const login = await request.post(`${API}/auth/login`, {
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = await login.json();
    const apiRes = await request.get(`${API}/api/v1/community/conversations?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const apiCount = ((await apiRes.json()).items ?? []).length;

    await page.context().addCookies([
      {
        name: "tt_session",
        value: token,
        domain: new URL(WEB).hostname,
        path: "/",
      },
    ]);
    await gotoStaging(page, `${WEB}/community/messages`);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
    if (apiCount > 0) {
      expect(body).not.toMatch(/mock-conversation|fake-thread/i);
    }
  });
});
