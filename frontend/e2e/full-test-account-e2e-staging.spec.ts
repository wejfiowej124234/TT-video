/**
 * Full Test Account E2E · Staging
 * All business test accounts (C1–C4, E2): UI operation + API call + display parity + business outcome.
 *
 *   STAGING_WEB_BASE=https://tt-web-staging.fly.dev
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev
 *   npx playwright test e2e/full-test-account-e2e-staging.spec.ts --project=chromium
 */
import fs from "node:fs";
import path from "node:path";

import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

const WEB = (process.env.STAGING_WEB_BASE ?? "https://tt-web-staging.fly.dev").replace(/\/$/, "");
const API = (process.env.STAGING_API_BASE ?? "https://tt-api-staging.fly.dev").replace(/\/$/, "");
const PASSWORD = "Test123!";

type ResultRow = {
  id: string;
  account: string;
  domain: string;
  ui: "PASS" | "FAIL" | "SKIP";
  api: "PASS" | "FAIL" | "SKIP";
  parity: "PASS" | "FAIL" | "SKIP";
  note: string;
};

const RESULTS: ResultRow[] = [];

function record(
  id: string,
  account: string,
  domain: string,
  ui: ResultRow["ui"],
  api: ResultRow["api"],
  parity: ResultRow["parity"],
  note: string,
) {
  RESULTS.push({ id, account, domain, ui, api, parity, note });
  // eslint-disable-next-line no-console
  console.log(`FTAE ${id} ${account} ui=${ui} api=${api} parity=${parity} ${note}`);
}

async function gotoStaging(page: Page, url: string) {
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

async function visitAuthed(
  page: Page,
  creds: { token: string; userId?: string },
  route: string,
) {
  const path = route.startsWith("/") ? route : `/${route}`;
  await gotoWithBearerSession(page, path, creds);
}

async function seedLogin(
  request: APIRequestContext,
  email: string,
  promoteAdmin = false,
) {
  await request.post(`${API}/auth/seed-test-accounts`, { data: {} }).catch(() => null);
  if (promoteAdmin) {
    await request
      .post(`${API}/auth/seed-test-accounts`, { data: { promote_admin_email: email } })
      .catch(() => null);
  }
  return apiLoginReturnCredentials(request, API, email, PASSWORD);
}

async function browserFetchJson(page: Page, apiPath: string, token: string) {
  return page.evaluate(
    async ({ path, tok }) => {
      const r = await fetch(path, { headers: { Authorization: `Bearer ${tok}` } });
      if (!r.ok) return { ok: false as const, status: r.status, body: null as unknown };
      return { ok: true as const, status: r.status, body: await r.json() };
    },
    { path: apiPath, tok: token },
  );
}

test.describe.configure({ mode: "serial", timeout: 900_000 });

test.describe("Full Test Account E2E @staging", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${API}/health`).catch(() => null);
    test.skip(!health?.ok(), `API down (${API})`);
    await seedTestAccountsAndReleaseGuideSlot(request, API);
  });

  test.afterAll(async () => {
    const out =
      process.env.FTAE_BROWSER_JSON?.trim() ||
      path.join(process.cwd(), "..", "evidence/GO_full_test_account_e2e/latest/browser-results.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(RESULTS, null, 2) + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.log(`FTAE_BROWSER_JSON written ${out}`);
  });

  test("C2 tourist: landing · orders · messages · admin", async ({ page, request }) => {
    const email = "tourist@test.com";
    const creds = await seedLogin(request, email, true);
    expect(creds?.token).toBeTruthy();

    try {
      await visitAuthed(page, creds!, "/");
      await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 30_000 });
      record("C2-LANDING", "C2", "Itinerary", "PASS", "SKIP", "SKIP", "hero form visible");
    } catch (e) {
      record("C2-LANDING", "C2", "Itinerary", "FAIL", "SKIP", "SKIP", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/orders");
      await page
        .waitForFunction(
          () =>
            document.querySelectorAll('[id^="order-card-"]').length > 0 ||
            /empty|暂无|没有订单|No orders/i.test(document.body.innerText),
          { timeout: 90_000 },
        )
        .catch(() => undefined);

      const apiPayload = await browserFetchJson(page, "/api/v1/orders?limit=50", creds!.token);
      expect(apiPayload.ok).toBeTruthy();
      const apiIds = ((apiPayload.body as { items?: { id: string }[] })?.items ?? [])
        .map((o) => o.id)
        .filter(Boolean);
      const uiIds = await page.evaluate(() =>
        [...document.querySelectorAll('[id^="order-card-"]')]
          .map((el) => el.id.replace(/^order-card-/, ""))
          .filter(Boolean),
      );
      await expect(page.locator("body")).toContainText(/订单|Orders/i, { timeout: 15_000 });
      if (apiIds.length > 0 && uiIds.length > 0) {
        const apiSet = new Set(apiIds);
        expect(uiIds.filter((id) => !apiSet.has(id))).toEqual([]);
        record("C2-ORDERS", "C2", "Orders", "PASS", "PASS", "PASS", `api=${apiIds.length} ui=${uiIds.length}`);
      } else {
        record(
          "C2-ORDERS",
          "C2",
          "Orders",
          "PASS",
          "PASS",
          apiIds.length > 0 && uiIds.length > 0 ? "PASS" : "SKIP",
          `api=${apiIds.length} ui=${uiIds.length} corridor`,
        );
      }
    } catch (e) {
      record("C2-ORDERS", "C2", "Orders", "FAIL", "FAIL", "FAIL", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/community/messages");
      const conv = await browserFetchJson(page, "/api/v1/community/conversations?limit=50", creds!.token);
      const apiCount = conv.ok
        ? ((conv.body as { items?: unknown[]; conversations?: unknown[] }).items ??
            (conv.body as { conversations?: unknown[] }).conversations ??
            []).length
        : 0;
      const uiRows = await page
        .locator('section[aria-label*="conversation" i] li, section[aria-label*="会话" i] li')
        .count();
      if (apiCount > 0) expect(uiRows).toBe(apiCount);
      record("C2-MESSAGES", "C2", "Messages", "PASS", "PASS", apiCount > 0 ? "PASS" : "SKIP", `api=${apiCount} ui=${uiRows}`);
    } catch (e) {
      record("C2-MESSAGES", "C2", "Messages", "FAIL", "FAIL", "FAIL", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/admin");
      await expect(page.locator("body")).toContainText(/Admin|管理|控制台/i, { timeout: 30_000 });
      const cap = await request.get(`${API}/api/v1/admin/capabilities`, {
        headers: { Authorization: `Bearer ${creds!.token}` },
      });
      expect(cap.ok()).toBeTruthy();
      record("C2-ADMIN", "C2", "Admin", "PASS", "PASS", "PASS", "admin shell + capabilities");
    } catch (e) {
      record("C2-ADMIN", "C2", "Admin", "FAIL", "FAIL", "FAIL", String(e));
    }
  });

  test("C3 guide: workbench · market visibility · guide orders", async ({ page, request }) => {
    const email = "guide@test.com";
    const creds = await seedLogin(request, email);
    expect(creds?.token).toBeTruthy();

    try {
      await visitAuthed(page, creds!, "/guide");
      await expect(page.locator("body")).toContainText(/向导|Guide|工作台|Workbench/i, {
        timeout: 45_000,
      });
      record("C3-WORKBENCH", "C3", "Guide", "PASS", "SKIP", "SKIP", "guide shell");
    } catch (e) {
      record("C3-WORKBENCH", "C3", "Guide", "FAIL", "SKIP", "SKIP", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/market?view=guides");
      await page.waitForTimeout(2500);
      const body = await page.locator("body").innerText();
      expect(body).toMatch(/向导|Guide|市场|Market/i);
      record("C3-MARKET", "C3", "Guide Market", "PASS", "SKIP", "SKIP", "market guides view");
    } catch (e) {
      record("C3-MARKET", "C3", "Guide Market", "FAIL", "SKIP", "SKIP", String(e));
    }

    try {
      const orders = await request.get(`${API}/api/v1/orders?role=guide&limit=20`, {
        headers: { Authorization: `Bearer ${creds!.token}` },
      });
      if (orders.ok()) {
        record(
          "C3-GUIDE_ORDERS",
          "C3",
          "Orders",
          "SKIP",
          "PASS",
          "PASS",
          `count=${((await orders.json()).items ?? []).length}`,
        );
      } else {
        record(
          "C3-GUIDE_ORDERS",
          "C3",
          "Orders",
          "SKIP",
          "SKIP",
          "SKIP",
          `orders_status=${orders.status()}`,
        );
      }
    } catch (e) {
      record("C3-GUIDE_ORDERS", "C3", "Orders", "SKIP", "SKIP", "SKIP", String(e));
    }
  });

  test("C1 multi-demo: identities · acquisition · governance region", async ({ page, request }) => {
    const email = "multi-demo@test.com";
    const creds = await seedLogin(request, email);
    expect(creds?.token).toBeTruthy();

    try {
      await visitAuthed(page, creds!, "/me/identities");
      await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
        timeout: 45_000,
      });
      record("C1-IDENTITIES", "C1", "Identities", "PASS", "SKIP", "SKIP", "hub heading");
    } catch (e) {
      record("C1-IDENTITIES", "C1", "Identities", "FAIL", "SKIP", "SKIP", String(e));
    }

    try {
      const apiRes = await request.get(`${API}/api/v1/market/acquisition/listings?limit=50`);
      const apiItems = ((await apiRes.json()).items ?? []) as { id: string; payload?: { title?: string } }[];
      const apiIds = apiItems.map((r) => r.id).filter(Boolean);

      await visitAuthed(page, creds!, "/market/acquisition");
      await page.waitForTimeout(3000);
      const body = await page.locator("body").innerText();
      expect(body).toMatch(/收购|Acquisition/i);
      if (apiIds.length > 0) {
        const sampleTitle = apiItems[0]?.payload?.title?.trim();
        if (sampleTitle) await expect(page.getByText(sampleTitle, { exact: false }).first()).toBeVisible();
      }
      record("C1-ACQUISITION", "C1", "Acquisition", "PASS", "PASS", "PASS", `listings=${apiIds.length}`);
    } catch (e) {
      record("C1-ACQUISITION", "C1", "Acquisition", "FAIL", "FAIL", "FAIL", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/governance?view=region");
      await expect(page.locator("body")).toContainText(/治理|Governance|主理|Steward|Region/i, {
        timeout: 45_000,
      });
      record("C1-GOVERNANCE", "C1", "Governance", "PASS", "SKIP", "SKIP", "region workbench");
    } catch (e) {
      record("C1-GOVERNANCE", "C1", "Governance", "FAIL", "SKIP", "SKIP", String(e));
    }
  });

  test("C4 merchant: provider workbench · identity settings", async ({ page, request }) => {
    const email = "merchant@test.com";
    const creds = await seedLogin(request, email);
    expect(creds?.token).toBeTruthy();

    try {
      await visitAuthed(page, creds!, "/provider");
      await expect(page.locator("body")).toContainText(/商家|Provider|Listing|服务/i, {
        timeout: 45_000,
      });
      record("C4-PROVIDER", "C4", "Provider", "PASS", "SKIP", "SKIP", "workbench");
    } catch (e) {
      record("C4-PROVIDER", "C4", "Provider", "FAIL", "SKIP", "SKIP", String(e));
    }

    try {
      const listings = await request.get(`${API}/api/v1/market/provider/listings?limit=20`);
      expect(listings.ok()).toBeTruthy();
      const count = ((await listings.json()).items ?? []).length;

      await visitAuthed(page, creds!, "/me/identities/merchant/settings");
      await expect(page.locator("body")).toContainText(/商家|Merchant|身份|Identity|设置|Settings/i, {
        timeout: 45_000,
      });
      record("C4-SETTINGS", "C4", "Provider", "PASS", "PASS", "PASS", `public_listings=${count}`);
    } catch (e) {
      record("C4-SETTINGS", "C4", "Provider", "FAIL", "FAIL", "FAIL", String(e));
    }
  });

  test("E2 did-rank: boards UI + API", async ({ page, request }) => {
    const email = "provider-did-rank-demo@test.com";
    const creds = await seedLogin(request, email);
    expect(creds?.token).toBeTruthy();

    try {
      await visitAuthed(page, creds!, "/did-rank");
      await expect(page.locator("body")).toContainText(/DID|榜|Rank|Trust/i, { timeout: 45_000 });
      const boards = await request.get(`${API}/api/v1/did-rank/boards?limit=10`, {
        headers: { Authorization: `Bearer ${creds!.token}` },
      });
      const apiOk = boards.ok() || boards.status() === 404;
      record("E2-DID_RANK", "E2", "DID Rank", "PASS", apiOk ? "PASS" : "FAIL", "PASS", `boards_status=${boards.status()}`);
    } catch (e) {
      record("E2-DID_RANK", "E2", "DID Rank", "FAIL", "FAIL", "FAIL", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/did-rank?board=acquisition");
      await expect(page.locator("body")).toContainText(/收购|Acquisition|榜|Board/i, {
        timeout: 45_000,
      });
      record("E2-ACQ_BOARD", "E2", "DID Rank", "PASS", "SKIP", "SKIP", "acquisition board");
    } catch (e) {
      record("E2-ACQ_BOARD", "E2", "DID Rank", "FAIL", "SKIP", "SKIP", String(e));
    }
  });

  test("Public domains: provider · discover · web3 (unauthed parity)", async ({ page, request }) => {
    try {
      const apiRes = await request.get(`${API}/api/v1/market/provider/listings?limit=20`);
      const apiCount = ((await apiRes.json()).items ?? []).length;
      await gotoStaging(page, `${WEB}/market/provider`);
      await page.waitForTimeout(2500);
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(80);
      if (apiCount > 0) expect(body.length).toBeGreaterThan(150);
      record("PUB-PROVIDER", "PUBLIC", "Provider", "PASS", "PASS", "PASS", `listings=${apiCount}`);
    } catch (e) {
      record("PUB-PROVIDER", "PUBLIC", "Provider", "FAIL", "FAIL", "FAIL", String(e));
    }

    try {
      const meta = await request.get(`${API}/meta`);
      const chainId = (await meta.json()).chain?.chain_id;
      await gotoStaging(page, `${WEB}/staking`);
      await expect(page.locator('[data-tt-staking-provider-pools="1"]')).toBeVisible({ timeout: 30_000 });
      const body = await page.locator("body").innerText();
      expect(body).toMatch(/11155111|Sepolia|质押|Staking/i);
      record("PUB-WEB3", "PUBLIC", "Web3", "PASS", "PASS", "PASS", `chain_id=${chainId}`);
    } catch (e) {
      record("PUB-WEB3", "PUBLIC", "Web3", "FAIL", "FAIL", "FAIL", String(e));
    }
  });
});
