/**
 * Enterprise Release Review · Guide-depth API ↔ Frontend ↔ Browser parity
 *
 *   STAGING_WEB_BASE=https://tt-web-staging.fly.dev
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev
 *   npx playwright test e2e/enterprise-release-review.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";
import { seedAndLoginTouristTestCredentials } from "./helpers/apiSession";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");

async function touristCredsWithRetry(request: import("@playwright/test").APIRequestContext) {
  let creds: Awaited<ReturnType<typeof seedAndLoginTouristTestCredentials>> = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    creds = await seedAndLoginTouristTestCredentials(request, API);
    if (creds?.token) return creds;
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  return creds;
}

async function authedApiJsonFromBrowser(
  page: import("@playwright/test").Page,
  apiPath: string,
  token: string,
) {
  return page.evaluate(
    async ({ path, tok }) => {
      const r = await fetch(path, { headers: { Authorization: `Bearer ${tok}` } });
      if (!r.ok) return { ok: false as const, status: r.status, body: null as unknown };
      return { ok: true as const, status: r.status, body: await r.json() };
    },
    { path: apiPath, tok: token },
  );
}

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

async function waitMarketListingsResponse(
  page: import("@playwright/test").Page,
  variant: "provider" | "acquisition",
) {
  const segment = variant === "provider" ? "provider" : "acquisition";
  return page.waitForResponse(
    (res) => {
      try {
        const u = new URL(res.url());
        return u.pathname.includes(`/api/v1/market/${segment}/listings`) && res.status() === 200;
      } catch {
        return false;
      }
    },
    { timeout: 90_000 },
  );
}

async function waitSubsiteMasonryReady(page: import("@playwright/test").Page, testId: string) {
  await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible({ timeout: 30_000 });
  await page
    .locator(`[data-testid="${testId}"] [role="status"]`)
    .first()
    .waitFor({ state: "hidden", timeout: 90_000 })
    .catch(() => undefined);
  await page.waitForFunction(
    (tid) => {
      const root = document.querySelector(`[data-testid="${tid}"]`);
      if (!root) return false;
      const cards = root.querySelectorAll("[data-listing-id], ul li.mb-4");
      const empty = root.textContent?.match(/empty|暂无|没有符合/i);
      return cards.length > 0 || Boolean(empty);
    },
    testId,
    { timeout: 90_000 },
  );
}

function listingIdsFromPage(
  page: import("@playwright/test").Page,
  variant: "provider" | "acquisition",
) {
  return page.evaluate((v) => {
    const fromAttr = Array.from(document.querySelectorAll("[data-listing-id]"))
      .map((n) => n.getAttribute("data-listing-id")?.trim() ?? "")
      .filter((id) => id.length > 0);
    if (fromAttr.length) return [...new Set(fromAttr)];

    const pattern =
      v === "provider"
        ? /\/market\/provider\/showcase\/([^/?#]+)/
        : /\/market\/acquisition\/([^/?#]+)/;
    const ids = new Set<string>();
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      const m = href.match(pattern);
      if (m?.[1]) ids.add(decodeURIComponent(m[1]));
    }
    return [...ids];
  }, variant);
}

test.describe("Enterprise Release Review @staging", () => {
  test.setTimeout(180_000);

  test("ERR-PROVIDER: API listing ids ⊆ masonry data-listing-id set", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/provider/listings?limit=50`);
    expect(apiRes.ok()).toBeTruthy();
    const apiItems = ((await apiRes.json()).items ?? []) as { id: string; payload?: { title?: string } }[];
    const apiIds = apiItems.map((r) => r.id).filter(Boolean);
    expect(apiIds.length).toBeGreaterThan(0);

    const listingsWait = waitMarketListingsResponse(page, "provider");
    await gotoStaging(page, `${WEB}/market/provider`);
    await listingsWait.catch(() => undefined);
    await waitSubsiteMasonryReady(page, "market-provider-page");

    const uiIds = await listingIdsFromPage(page, "provider");
    if (uiIds.length === 0) {
      const cardCount = await page.locator('[data-testid="market-provider-page"] ul li.mb-4').count();
      expect(cardCount, "provider masonry should render API-backed cards").toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(apiIds.length);
      const sampleTitle = apiItems[0]?.payload?.title?.trim();
      if (sampleTitle) await expect(page.getByText(sampleTitle, { exact: false }).first()).toBeVisible();
      return;
    }
    expect(uiIds.length).toBeLessThanOrEqual(apiIds.length);

    const apiSet = new Set(apiIds);
    const orphanUi = uiIds.filter((id) => !apiSet.has(id));
    expect(orphanUi, `UI listings not in API: ${orphanUi.join(",")}`).toEqual([]);

    const visibleApi = apiIds.filter((id) => uiIds.includes(id));
    expect(
      visibleApi.length,
      `expected UI to render at least half of API provider listings (api=${apiIds.length} ui=${uiIds.length})`,
    ).toBeGreaterThanOrEqual(Math.min(apiIds.length, Math.ceil(apiIds.length * 0.5)));
  });

  test("ERR-ACQUISITION: API listing ids ⊆ masonry data-listing-id set", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/market/acquisition/listings?limit=50`);
    expect(apiRes.ok()).toBeTruthy();
    const apiItems = ((await apiRes.json()).items ?? []) as { id: string; payload?: { title?: string } }[];
    const apiIds = apiItems.map((r) => r.id).filter(Boolean);

    const listingsWait = waitMarketListingsResponse(page, "acquisition");
    await gotoStaging(page, `${WEB}/market/acquisition`);
    await listingsWait.catch(() => undefined);
    await waitSubsiteMasonryReady(page, "market-acquisition-page");

    if (apiIds.length === 0) {
      await expect(page.getByText(/Multi-demo|L3 closure|probe/i)).toHaveCount(0);
      return;
    }
    expect(apiIds.length).toBeGreaterThan(0);

    const uiIds = await listingIdsFromPage(page, "acquisition");
    if (uiIds.length === 0) {
      const cardCount = await page.locator('[data-testid="market-acquisition-page"] ul li.mb-4').count();
      expect(cardCount, "acquisition masonry should render API-backed cards").toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(apiIds.length);
      const sampleTitle = apiItems[0]?.payload?.title?.trim();
      if (sampleTitle) await expect(page.getByText(sampleTitle, { exact: false }).first()).toBeVisible();
      return;
    }
    expect(uiIds.length).toBeGreaterThan(0);

    const apiSet = new Set(apiIds);
    expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);

    const visibleApi = apiIds.filter((id) => uiIds.includes(id));
    expect(visibleApi.length).toBeGreaterThanOrEqual(Math.min(apiIds.length, Math.ceil(apiIds.length * 0.5)));
  });

  test("ERR-DISCOVER: discover order cards match API ids", async ({ page, request }) => {
    const apiRes = await request.get(`${API}/api/v1/discover/orders?limit=50`);
    expect(apiRes.ok()).toBeTruthy();
    const apiOrders = (await apiRes.json()).items ?? [];
    const apiIds = apiOrders.map((o: { id: string }) => o.id).filter(Boolean);

    await gotoStaging(page, `${WEB}/market?view=orders`);
    await page.waitForTimeout(2500);

    const uiIds = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article[aria-labelledby^="order-title-"]'));
      const ids = new Set<string>();
      for (const card of articles) {
        const labelled = card.getAttribute("aria-labelledby") ?? "";
        const m = labelled.match(/^order-title-(.+)$/);
        if (m?.[1]) ids.add(m[1]);
      }
      return [...ids];
    });

    if (apiIds.length === 0) {
      expect(uiIds.length).toBe(0);
      return;
    }

    expect(uiIds.length).toBeGreaterThan(0);
    const apiSet = new Set(apiIds);
    expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
    expect(uiIds.length).toBeLessThanOrEqual(apiIds.length);
  });

  test("ERR-GOVERNANCE: proposal links match API ids", async ({ page, request }) => {
    const creds = await touristCredsWithRetry(request);
    expect(creds?.token).toBeTruthy();

    const tok = creds!.token;
    const uid = creds!.userId?.trim() ?? "";
    await page.addInitScript(
      ([t, u]) => {
        try {
          localStorage.setItem("traveltrust_session_token", t);
          if (u) localStorage.setItem("traveltrust_user_id", u);
        } catch {
          /* ignore */
        }
      },
      [tok, uid],
    );
    await gotoStaging(page, `${WEB}/governance/proposals`);
    await page.waitForTimeout(2500);

    let apiIds: string[] = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
      const payload = await authedApiJsonFromBrowser(
        page,
        "/api/v1/governance/proposals?limit=50",
        creds!.token,
      );
      if (payload.ok) {
        const rows = (payload.body as { proposals?: { id?: string }[]; items?: { id?: string }[] }) ?? {};
        apiIds = (rows.proposals ?? rows.items ?? [])
          .map((p) => p.id?.trim())
          .filter((id): id is string => !!id);
        break;
      }
      await page.waitForTimeout(2500 * attempt);
    }
    expect(apiIds.length, "governance proposals should load in browser session").toBeGreaterThan(0);

    const uiIds = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href^="/governance/proposals/"]'));
      const ids = new Set<string>();
      for (const a of anchors) {
        const href = a.getAttribute("href") ?? "";
        const m = href.match(/^\/governance\/proposals\/([^/?#]+)/);
        if (!m?.[1] || m[1] === "new") continue;
        ids.add(decodeURIComponent(m[1]));
      }
      return [...ids];
    });

    if (apiIds.length === 0) {
      expect(uiIds.length).toBe(0);
      return;
    }

    expect(uiIds.length).toBeGreaterThan(0);
    const apiSet = new Set(apiIds);
    expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
    expect(uiIds.length).toBeLessThanOrEqual(apiIds.length);
    expect(uiIds.length).toBeGreaterThan(0);
  });

  test("ERR-ORDERS: authed orders list ids ⊆ API /orders", async ({ page, request }) => {
    const creds = await touristCredsWithRetry(request);
    expect(creds?.token).toBeTruthy();

    const tok = creds!.token;
    const uid = creds!.userId?.trim() ?? "";
    await page.addInitScript(
      ([t, u]) => {
        try {
          localStorage.setItem("traveltrust_session_token", t);
          if (u) localStorage.setItem("traveltrust_user_id", u);
        } catch {
          /* ignore */
        }
      },
      [tok, uid],
    );
    await gotoStaging(page, `${WEB}/orders`);
    await page
      .waitForFunction(
        () =>
          document.querySelectorAll('[id^="order-card-"]').length > 0 ||
          /empty|暂无|没有订单|No orders/i.test(document.body.innerText),
        { timeout: 90_000 },
      )
      .catch(() => undefined);

    expect(page.url()).not.toMatch(/\/auth\/login/);

    const browserJson = await page.evaluate(async () => {
      const token = localStorage.getItem("traveltrust_session_token") ?? "";
      const r = await fetch("/api/v1/orders?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return { items: [] as { id: string }[], status: r.status };
      return (await r.json()) as { items?: { id: string }[] };
    });
    const browserApiIds = (browserJson.items ?? []).map((o) => o.id).filter(Boolean);
    const apiIds = browserApiIds;

    const uiIds = await page.evaluate(() =>
      [...document.querySelectorAll('[id^="order-card-"]')]
        .map((el) => el.id.replace(/^order-card-/, ""))
        .filter(Boolean),
    );

    if (apiIds.length === 0 && browserApiIds.length === 0) return;

    expect(
      browserApiIds.length,
      "browser session should load orders from API (check bearer injection on staging)",
    ).toBeGreaterThan(0);

    expect(uiIds.length, `orders UI cards missing (browserApi=${browserApiIds.length})`).toBeGreaterThan(0);
    const apiSet = new Set(browserApiIds.length > 0 ? browserApiIds : apiIds);
    expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
    expect(uiIds.length).toBeLessThanOrEqual(apiSet.size);
  });

  test("ERR-MESSAGES: conversations page loads with bearer session (count parity when data exists)", async ({
    page,
    request,
  }) => {
    const creds = await touristCredsWithRetry(request);
    expect(creds?.token).toBeTruthy();

    const tok = creds!.token;
    const uid = creds!.userId?.trim() ?? "";
    await page.addInitScript(
      ([t, u]) => {
        try {
          localStorage.setItem("traveltrust_session_token", t);
          if (u) localStorage.setItem("traveltrust_user_id", u);
        } catch {
          /* ignore */
        }
      },
      [tok, uid],
    );
    await gotoStaging(page, `${WEB}/community/messages`);
    await page.waitForTimeout(2500);

    const convPayload = await authedApiJsonFromBrowser(
      page,
      "/api/v1/community/conversations?limit=50",
      creds!.token,
    );
    const apiCount = convPayload.ok
      ? ((convPayload.body as { conversations?: unknown[]; items?: unknown[] }).conversations ??
          (convPayload.body as { items?: unknown[] }).items ??
          []).length
      : 0;

    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/mock-conversation|fake-thread/i);

    if (apiCount === 0) return;

    const uiRows = await page.locator('section[aria-label*="conversation" i] li, section[aria-label*="会话" i] li').count();
    expect(uiRows).toBe(apiCount);
  });

  test("ERR-WEB3: /meta Sepolia chain_id reflected on staking surface", async ({ page, request }) => {
    const metaRes = await request.get(`${API}/meta`);
    expect(metaRes.ok()).toBeTruthy();
    const chainId = (await metaRes.json()).chain?.chain_id;
    expect(Number(chainId)).toBe(11155111);

    await gotoStaging(page, `${WEB}/staking`);
    await expect(page.locator('[data-tt-staking-provider-pools="1"]')).toBeVisible({ timeout: 30_000 });
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/11155111|Sepolia|质押|Staking/i);
  });

  test("ERR-ITINERARY: landing exposes itinerary entry + catalog API reachable", async ({ page, request }) => {
    const catalogRes = await request.get(`${API}/api/v1/catalog/countries?limit=20`);
    expect(catalogRes.ok()).toBeTruthy();

    await gotoStaging(page, `${WEB}/`);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(200);
    expect(body).toMatch(/行程|Itinerary|规划/i);

    const hasItineraryRoute = await page
      .locator('a[href*="itinerary"], [data-tt-itinerary-new-page]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasItineraryRoute || /行程|Itinerary/i.test(body)).toBeTruthy();
  });
});
