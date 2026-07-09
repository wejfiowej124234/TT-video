/**
 * Manual UAT C1–E2 · 浏览器走查（① local · TT-LOCAL-UI-MANUAL-UAT-CHECKLIST）
 *
 * 真实 UI 登录 + 逐页访问 + §0 最低检（无白屏/无 Application error/主内容可见）。
 * 旁证输出：`MANUAL_UAT_BROWSER_RESULTS_JSON` 或默认 evidence 路径。
 *
 *   cd frontend && npx playwright test e2e/manual-uat-c1e2-browser-walkthrough.spec.ts --project=chromium
 */
import fs from "node:fs";
import path from "node:path";

import { test, expect, type Page } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

const PASSWORD = "Test123!";
const RESULTS: { id: string; status: "PASS" | "FAIL"; note: string }[] = [];

function record(id: string, status: "PASS" | "FAIL", note: string) {
  RESULTS.push({ id, status, note });
  // eslint-disable-next-line no-console
  console.log(`MANUAL_UAT_ITEM ${id} ${status} ${note}`);
}

async function gotoLoginWhenReady(page: Page, returnPath: string) {
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(`/auth/login?returnUrl=${encodeURIComponent(path)}`, { timeout: 60_000 });
    const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
    try {
      await emailBox.waitFor({ state: "visible", timeout: 25_000 });
      return path;
    } catch {
      if (attempt === 2) throw new Error("login page not ready");
    }
  }
  return path;
}

async function uiLogin(page: Page, returnPath: string, email: string) {
  const expectedPath = await gotoLoginWhenReady(page, returnPath);
  await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
  await page.getByLabel(/password|密码/i).fill(PASSWORD);
  await Promise.all([
    page.waitForURL((u) => u.pathname === expectedPath, { timeout: 45_000 }),
    page.getByRole("button", { name: /Log in|登录|Sign in/i }).click(),
  ]);
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: 35_000,
  });
}

async function assertSection0(page: Page, id: string) {
  const bodyText = ((await page.locator("body").innerText().catch(() => "")) ?? "").trim();
  expect(bodyText.length, `${id} §0 empty body`).toBeGreaterThanOrEqual(40);
  await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);
  const main = page.locator("main").first();
  if ((await main.count()) > 0) {
    await expect(main).toBeVisible({ timeout: 15_000 });
  }
}

async function visitAuthed(page: Page, creds: { token: string; userId?: string }, route: string) {
  await gotoWithBearerSession(page, route, creds);
}

test.describe.configure({ mode: "serial", timeout: 600_000 });

test.describe("Manual UAT C1–E2 browser walkthrough", () => {
  const pageErrors: string[] = [];

  test.beforeAll(async ({ request }) => {
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    test.skip(!health?.ok(), `API down (${apiBase})`);
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    await request
      .post(`${apiBase}/auth/seed-trust-gate-e2e`, { data: "{}" })
      .catch(() => null);
  });

  test.afterAll(async () => {
    const out =
      process.env.MANUAL_UAT_BROWSER_RESULTS_JSON?.trim() ||
      path.join(
        process.cwd(),
        "..",
        "evidence/manual-uat/sessions/latest/browser-walkthrough-results.json",
      );
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(RESULTS, null, 2) + "\n", "utf8");
    // eslint-disable-next-line no-console
    console.log(`MANUAL_UAT_BROWSER_RESULTS written ${out}`);
  });

  test("C1 multi-demo corridor", async ({ page, request }) => {
    page.on("pageerror", (e) => pageErrors.push(e.message));
    const apiBase = defaultApiBase();
    const email = "multi-demo@test.com";

    try {
      await uiLogin(page, "/me/identities", email);
      record("C1-1", "PASS", "UI login multi-demo → identities");
    } catch (e) {
      record("C1-1", "FAIL", String(e));
      throw e;
    }

    try {
      await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible({
        timeout: 45_000,
      });
      record("C1-2", "PASS", "identities hub heading visible");
    } catch (e) {
      record("C1-2", "FAIL", String(e));
    }

    try {
      await visitAuthed(
        page,
        (await apiLoginReturnCredentials(request, apiBase, email, PASSWORD))!,
        "/me/publish",
      );
      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.getByText(/Publish|发布/i).first()).toBeVisible({ timeout: 30_000 });
      record("C1-3", "PASS", "publish hub visible");
    } catch (e) {
      record("C1-3", "FAIL", String(e));
    }

    try {
      await visitAuthed(
        page,
        (await apiLoginReturnCredentials(request, apiBase, email, PASSWORD))!,
        "/governance?view=region",
      );
      await expect(page.locator("body")).toContainText(/治理|Governance|主理|Steward|Region/i, {
        timeout: 45_000,
      });
      record("C1-4", "PASS", "governance region workbench");
    } catch (e) {
      record("C1-4", "FAIL", String(e));
    }

    try {
      await visitAuthed(
        page,
        (await apiLoginReturnCredentials(request, apiBase, email, PASSWORD))!,
        "/market/acquisition",
      );
      await expect(page.locator("body")).toContainText(/收购|Acquisition/i, { timeout: 45_000 });
      record("C1-5", "PASS", "acquisition subsite");
    } catch (e) {
      record("C1-5", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "C1-6");
      record("C1-6", "PASS", "§0 no white screen / no app error");
    } catch (e) {
      record("C1-6", "FAIL", String(e));
    }
  });

  test("C2 tourist corridor", async ({ page, request }) => {
    pageErrors.length = 0;
    page.on("pageerror", (e) => pageErrors.push(e.message));
    const apiBase = defaultApiBase();
    const email = "tourist@test.com";

    try {
      await uiLogin(page, "/", email);
      record("C2-1", "PASS", "UI login tourist → home");
    } catch (e) {
      record("C2-1", "FAIL", String(e));
      throw e;
    }

    try {
      await expect(page.locator("#landing-hero-form")).toBeVisible({ timeout: 30_000 });
      record("C2-2", "PASS", "landing hero form visible");
    } catch (e) {
      record("C2-2", "FAIL", String(e));
    }

    const creds = await apiLoginReturnCredentials(request, apiBase, email, PASSWORD);
    test.skip(!creds, "tourist creds");

    for (const [id, route, needle] of [
      ["C2-3", "/market", /市场|Market|Discover/i],
      ["C2-4", "/community", /社区|Community|Feed/i],
      ["C2-5", "/orders", /订单|Orders/i],
    ] as const) {
      try {
        await visitAuthed(page, creds!, route);
        await expect(page.locator("body")).toContainText(needle, { timeout: 45_000 });
        record(id, "PASS", `${route} content visible`);
      } catch (e) {
        record(id, "FAIL", String(e));
      }
    }

    try {
      await visitAuthed(page, creds!, "/admin");
      await page.waitForURL(/\/admin/, { timeout: 30_000 });
      await expect(page.locator("body")).toContainText(/Admin|管理|控制台/i, { timeout: 30_000 });
      record("C2-6", "PASS", "admin entry reachable");
    } catch (e) {
      record("C2-6", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "C2-7");
      record("C2-7", "PASS", "§0 healthy");
    } catch (e) {
      record("C2-7", "FAIL", String(e));
    }
  });

  test("C3 guide corridor", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const email = "guide@test.com";

    try {
      await uiLogin(page, "/guide", email);
      record("C3-1", "PASS", "UI login guide → workbench");
    } catch (e) {
      record("C3-1", "FAIL", String(e));
      throw e;
    }

    try {
      await expect(page.locator('[data-tt-guide-workspace-page="1"]')).toBeVisible({ timeout: 45_000 });
      record("C3-2", "PASS", "guide workbench shell");
    } catch (e) {
      record("C3-2", "FAIL", String(e));
    }

    try {
      const creds = await apiLoginReturnCredentials(request, apiBase, email, PASSWORD);
      await visitAuthed(page, creds!, "/market?view=guides");
      await expect(page.locator("body")).toContainText(/向导|Guide|Market|市场/i, { timeout: 45_000 });
      record("C3-3", "PASS", "market guides view");
    } catch (e) {
      record("C3-3", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "C3-4");
      record("C3-4", "PASS", "§0 healthy");
    } catch (e) {
      record("C3-4", "FAIL", String(e));
    }
  });

  test("C4 merchant corridor", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const email = "merchant@test.com";

    try {
      await uiLogin(page, "/provider", email);
      record("C4-1", "PASS", "UI login merchant → provider");
    } catch (e) {
      record("C4-1", "FAIL", String(e));
      throw e;
    }

    try {
      await expect(page.locator("body")).toContainText(/商家|Provider|Listing|服务/i, {
        timeout: 45_000,
      });
      record("C4-2", "PASS", "provider workbench");
    } catch (e) {
      record("C4-2", "FAIL", String(e));
    }

    try {
      const creds = await apiLoginReturnCredentials(request, apiBase, email, PASSWORD);
      await visitAuthed(page, creds!, "/me/identities/merchant/settings");
      await expect(page.locator("body")).toContainText(/商家|Merchant|身份|Identity|设置|Settings/i, {
        timeout: 45_000,
      });
      record("C4-3", "PASS", "merchant identity settings");
    } catch (e) {
      record("C4-3", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "C4-4");
      record("C4-4", "PASS", "§0 healthy");
    } catch (e) {
      record("C4-4", "FAIL", String(e));
    }
  });

  test("E1 dual-account corridor", async ({ page, request }) => {
    const apiBase = defaultApiBase();

    try {
      const tourist = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", PASSWORD);
      test.skip(!tourist, "tourist creds");
      await visitAuthed(page, tourist!, "/orders");
      await expect(page.locator("body")).toContainText(/订单|Orders/i, { timeout: 45_000 });
      record("E1-1", "PASS", "tourist orders entry");
    } catch (e) {
      record("E1-1", "FAIL", String(e));
    }

    try {
      await uiLogin(page, "/guide", "tg_guide_main@trustgate-e2e.local");
      await expect(page.locator('[data-tt-guide-workspace-page="1"]')).toBeVisible({ timeout: 60_000 });
      record("E1-2", "PASS", "trustgate guide UI login → workbench");
    } catch (e) {
      record("E1-2", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "E1-3");
      record("E1-3", "PASS", "§0 healthy");
    } catch (e) {
      record("E1-3", "FAIL", String(e));
    }
  });

  test("E2 did-rank corridor", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const email = "provider-did-rank-demo@test.com";
    const creds = await apiLoginReturnCredentials(request, apiBase, email, PASSWORD);
    test.skip(!creds, "E2 creds");

    try {
      await visitAuthed(page, creds!, "/did-rank");
      await expect(page.locator("body")).toContainText(/DID|榜|Rank|Trust/i, { timeout: 45_000 });
      record("E2-1", "PASS", "did-rank main");
    } catch (e) {
      record("E2-1", "FAIL", String(e));
    }

    try {
      await visitAuthed(page, creds!, "/did-rank?board=acquisition");
      await expect(page.locator("body")).toContainText(/收购|Acquisition|榜|Board/i, {
        timeout: 45_000,
      });
      record("E2-2", "PASS", "acquisition board");
    } catch (e) {
      record("E2-2", "FAIL", String(e));
    }

    try {
      await assertSection0(page, "E2-3");
      record("E2-3", "PASS", "§0 healthy");
    } catch (e) {
      record("E2-3", "FAIL", String(e));
    }
  });
});
