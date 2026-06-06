/**
 * 93 矩阵 · 企业级 P1 补齐批次（**NOT RUN → PASS/SKIP** 收口；与 `93-matrix-path-p1-remediation.spec.ts` 互补）。
 *
 * 覆盖（本轮）：**A-ME-002** `/me` 资料编辑读回写；**B-MKT-002** 扩展 URL↔`GET …/discover/orders`；**D-COM-004** 私信列表空态或会话首条与 API 对拍；
 * **向导** `/guide` 登录态主区域；**管理员** Admin 抽检页；**未登录** `/me` 门禁；**登录负例**错误态。
 *
 * 证据与 curl 模板：**`evidence/93-batch-enterprise-p1/<run_id>/`**（见该目录 `README.md`）。
 *
 * 复跑（与仓库 chromium 项目一致，依赖 **setup-meta-chain**）：
 * `cd frontend && npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium`
 * 全栈：`PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-enterprise-p1-batch.spec.ts --project=chromium`
 *
 * **TT-L4**：各 `test.describe` 名含 **`@e2e-sepolia-deferred`**，由既有 **`chromium-sepolia`** **`grepInvert`** 排除，**不**改 `playwright.config.ts`。
 */
import { test, expect, type Page } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { addSmokeAdminCookies } from "./helpers/smoke-nav";

async function gotoLoginWhenReady(page: Page, loginHref: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(loginHref, { timeout: 60_000 });
    const emailBox = page.getByRole("textbox", { name: /email|邮箱/i });
    try {
      await emailBox.waitFor({ state: "visible", timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error("login page did not become ready");
    }
  }
}

async function uiLoginWithPassword(page: Page, returnPath: string, email: string, password: string) {
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(path)}`);
  await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
  await page.getByLabel(/password|密码/i).fill(password);
  const expectedPath = new URL(path, "http://localhost").pathname;
  await Promise.all([
    page.waitForURL((u) => u.pathname === expectedPath, { timeout: 35_000 }),
    page.getByRole("button", { name: /Log in|登录/i }).click(),
  ]);
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({ timeout: 30_000 });
}

test.describe("93-enterprise P1 · A-ME-002 /me profile edit read-back @e2e-sepolia-deferred", () => {
  test("昵称编辑提交后再读 UI 与 GET /me 一致", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);

    const suffix = `e2e-${Date.now()}`;
    const newNickname = `Tourist ${suffix}`;

    await uiLoginWithPassword(page, "/community/me", "tourist@test.com", "Test123!");
    await expect(page.getByRole("main", { name: /Community profile|社区资料/i })).toBeVisible({
      timeout: 25_000,
    });

    await page.getByRole("button", { name: /Edit profile|编辑资料/i }).click();
    const nickInput = page.getByLabel(/Nickname|昵称/i);
    await nickInput.waitFor({ state: "visible", timeout: 15_000 });
    await nickInput.fill(newNickname);
    await page.getByRole("button", { name: /^Save$|^保存$/i }).click();

    await expect(page.getByText(newNickname, { exact: false }).first()).toBeVisible({ timeout: 25_000 });

    const login = await request.post(`${apiBase}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    expect(login.ok()).toBeTruthy();
    const tok = ((await login.json()) as { token?: string }).token?.trim();
    expect(tok?.length).toBeTruthy();
    const me = await request.get(`${apiBase}/api/v1/me`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    expect(me.ok()).toBeTruthy();
    const body = (await me.json()) as { user?: { nickname?: string | null } };
    expect((body.user?.nickname ?? "").trim()).toBe(newNickname);
  });
});

test.describe("93-enterprise P1 · B-MKT-002 market URL vs discover orders API @e2e-sepolia-deferred", () => {
  test("深链 country/city 与 GET …/discover/orders 对拍", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "tourist 登录失败");
    }

    const country = "日本";
    const city = "东京";
    const path = `/market?view=orders&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`;
    await gotoWithBearerSession(page, path, creds);

    await expect(page.getByTestId("market-page")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(new RegExp(`country=${encodeURIComponent(country)}`));
    await expect(page).toHaveURL(new RegExp(`city=${encodeURIComponent(city)}`));

    const q = new URLSearchParams({ country, city, limit: "50" });
    const apiRes = await request.get(`${apiBase}/api/v1/discover/orders?${q.toString()}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(apiRes.ok(), await apiRes.text()).toBeTruthy();
    const j = (await apiRes.json()) as { items?: unknown[] };
    const nApi = Array.isArray(j.items) ? j.items.length : 0;
    const nLinks = await page.locator('a[href*="/escrow/"]').count();
    if (nApi === 0) {
      expect(nLinks).toBe(0);
    } else {
      expect(nLinks).toBeLessThanOrEqual(nApi + 2);
    }
  });
});

test.describe("93-enterprise P1 · D-COM-004 community messages list @e2e-sepolia-deferred", () => {
  test("会话列表 API 与首屏对拍（空态或有数据）", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "tourist 登录失败");
    }

    const listRes = await request.get(`${apiBase}/api/v1/community/conversations`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(listRes.ok(), await listRes.text()).toBeTruthy();
    const listJson = (await listRes.json()) as { conversations?: Array<{ id?: string; peer_nickname?: string }> };
    const convs = Array.isArray(listJson.conversations) ? listJson.conversations : [];

    await gotoWithBearerSession(page, "/community/messages", creds);
    await expect(page.getByRole("main", { name: /Messages|消息/i })).toBeVisible({ timeout: 30_000 });

    if (convs.length === 0) {
      await expect(page.getByText(/No messages yet|暂无消息/i).first()).toBeVisible({ timeout: 25_000 });
      return;
    }

    const first = convs[0];
    expect(first?.id?.length).toBeTruthy();
    await expect(page.getByText(first.peer_nickname ?? "", { exact: false }).first()).toBeVisible({
      timeout: 25_000,
    });
  });
});

test.describe("93-enterprise P1 · guide hub /guide @e2e-sepolia-deferred", () => {
  test("guide@test.com 登录态主区域", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    await uiLoginWithPassword(page, "/guide", "guide@test.com", "Test123!");
    await expect(page.getByRole("main", { name: /Guide workspace|向导工作台/i })).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("93-enterprise P1 · D-ADM-002 admin finance hub slice @e2e-sepolia-deferred", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("/admin/finance 与 /admin/finance-reconciliation 可达", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/admin/finance", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin finance summary|Admin 财务摘要/i }),
    ).toBeVisible({ timeout: 30_000 });
    await page.goto("/admin/finance-reconciliation", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Finance · read-only hub|财务 · 只读枢纽/i }),
    ).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("93-enterprise P1 · guest /me gate @e2e-sepolia-deferred", () => {
  test("未登录访问 /me 导向登录或错误面", async ({ page, context }) => {
    test.setTimeout(90_000);
    await context.clearCookies();
    await page.goto("/", { timeout: 30_000 });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/community/me", { timeout: 60_000 });
    const onLogin = page.url().includes("/auth/login");
    const retry = page.getByRole("button", { name: /Retry|重试/i });
    const loginLink = page.getByRole("link", { name: /Log in|登录/i });
    expect(onLogin || (await retry.isVisible().catch(() => false)) || (await loginLink.isVisible().catch(() => false))).toBe(
      true,
    );
  });
});

test.describe("93-enterprise P1 · A-LOG-001 negative login @e2e-sepolia-deferred", () => {
  test("错误密码展示错误态（非 200 会话）", async ({ page }) => {
    test.setTimeout(90_000);
    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/community/me")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("DefinitelyWrongPassword123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
    await expect(
      page.getByRole("alert").filter({
        hasText: /Incorrect email or password|邮箱或密码不正确|Login failed|登录失败/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
