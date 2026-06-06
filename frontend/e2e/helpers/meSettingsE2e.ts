import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";

import {
  apiLoginReturnCredentials,
  seedTestAccountsAndReleaseGuideSlot,
  type BearerSessionCredentials,
} from "./apiSession";
import { fillAndSubmitLoginForm } from "./uiAuthControlledForms";
import { headerUserMenuTrigger, openHeaderUserMenuDropdown } from "./headerUserMenu";

/** 新注册游客（未走 verify-email）· 用于 Hub 未验证邮箱 chip E2E */
export async function registerUnverifiedTouristCredentials(
  request: APIRequestContext,
  apiBase: string,
  password = "Test123!",
): Promise<BearerSessionCredentials | null> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const email = `me-settings-unverified-${stamp}@traveltrust.test`;
  const reg = await request.post(`${apiBase}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password, nickname: `ms-${stamp}` },
  });
  if (!reg.ok()) return null;
  const body = (await reg.json()) as { token?: string; user_id?: string };
  const token = body.token?.trim();
  if (!token) return null;
  const userId = body.user_id?.trim() ?? "";
  return userId ? { token, userId } : { token, userId: "" };
}

/** L5 确认弹窗（`MeSettingsL5ConfirmDialog` · portal `alertdialog`） */
export async function confirmMeSettingsL5Dialog(
  page: Page,
  confirmLabel: RegExp = /Log out|登出|退出|确认|Continue|继续|Download|下载|header_logout/i,
) {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible({ timeout: 25_000 });
  await expect(page.locator('[data-tt-me-settings-confirm="me-settings-confirm"]')).toBeVisible();
  const buttons = dialog.getByRole("button");
  const confirmBtn = buttons.filter({ hasText: confirmLabel });
  if ((await confirmBtn.count()) > 0) {
    await confirmBtn.first().click();
  } else {
    await buttons.nth(1).click();
  }
  await expect(dialog).toHaveCount(0, { timeout: 25_000 });
}

/** 顶栏 `HeaderUserMenuL5Logout`：确认后登出 */
export async function headerLogoutWithL5Confirm(page: Page) {
  const dropdown = await openHeaderUserMenuDropdown(page);
  await dropdown.locator('[data-tt-header-logout-l5="1"]').click();
  await confirmMeSettingsL5Dialog(page, /Log out|登出|退出/i);
  await expect(headerUserMenuTrigger(page)).toHaveCount(0, { timeout: 90_000 });
}

/** 数据子页 · 删号 → 反馈工单预填 URL */
export const ME_SETTINGS_DELETE_ACCOUNT_FEEDBACK_PATH =
  "/community/feedback?from=settings-data&intent=delete-account";

/** 已验证种子游客（邮箱 chip 应隐藏） */
export async function seedTouristCredentials(
  request: APIRequestContext,
  apiBase: string,
): Promise<BearerSessionCredentials | null> {
  return apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
}

/** Hub 内 `MeSettingsLogoutButton`：L5 确认后登出 */
export async function hubSettingsLogoutWithL5Confirm(page: Page) {
  await page.locator('[data-tt-me-settings-logout="1"]').click();
  await confirmMeSettingsL5Dialog(page, /Log out|登出|退出/i);
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
}

/** `/community/me` · `MeLogoutL5Button` community 变体 */
export async function communityMeLogoutWithL5Confirm(page: Page) {
  await page.locator('[data-tt-me-logout-l5="1"]').click();
  await confirmMeSettingsL5Dialog(page, /Log out|登出|退出/i);
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
}

/** 与 API `session_token_suffix` 对齐（末 6 位） */
export function meSessionTokenSuffix(token: string): string {
  return token.length <= 6 ? token : token.slice(-6);
}

const TOURIST_EMAIL = "tourist@test.com";
const TOURIST_PASSWORD = "Test123!";

/** ① 真双会话：第二 BrowserContext UI 登录 → 与 primary API token 不同后缀 */
export async function loginTouristDualSessionViaBrowser(
  browser: Browser,
  request: APIRequestContext,
  apiBase: string,
): Promise<{ primary: BearerSessionCredentials; secondarySuffix: string } | null> {
  await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  const primary = await apiLoginReturnCredentials(request, apiBase, TOURIST_EMAIL, TOURIST_PASSWORD);
  if (!primary?.token) return null;

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  try {
    const loginWait = page2.waitForResponse(
      (r) => {
        if (r.request().method() !== "POST") return false;
        try {
          return new URL(r.url()).pathname.replace(/\/$/, "").endsWith("/auth/login");
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    );
    await page2.goto("/auth/login?returnUrl=%2Fme%2Fsettings");
    const loginRoot = page2.locator('[data-tt-auth-route="login"]');
    await fillAndSubmitLoginForm(loginRoot, TOURIST_EMAIL, TOURIST_PASSWORD);
    await loginWait;
    const secondaryToken = await page2.evaluate(
      () => localStorage.getItem("traveltrust_session_token")?.trim() ?? "",
    );
    if (!secondaryToken || secondaryToken === primary.token) return null;
    return { primary, secondarySuffix: meSessionTokenSuffix(secondaryToken) };
  } finally {
    await ctx2.close();
  }
}

/** ① 真双会话：两次 `auth/login`（PG 下 token 不同；无 PG 时回退 browser） */
export async function loginTouristWithSecondarySession(
  request: APIRequestContext,
  apiBase: string,
): Promise<{ primary: BearerSessionCredentials; secondarySuffix: string } | null> {
  await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  const primary = await apiLoginReturnCredentials(request, apiBase, TOURIST_EMAIL, TOURIST_PASSWORD);
  let secondary = await apiLoginReturnCredentials(request, apiBase, TOURIST_EMAIL, TOURIST_PASSWORD);
  if (!primary?.token) return null;
  if (!secondary?.token || secondary.token === primary.token) {
    secondary = await apiLoginReturnCredentials(request, apiBase, TOURIST_EMAIL, TOURIST_PASSWORD);
  }
  if (!secondary?.token || secondary.token === primary.token) return null;
  return {
    primary,
    secondarySuffix: meSessionTokenSuffix(secondary.token),
  };
}

export async function fetchMeSessionsItemCount(
  request: APIRequestContext,
  token: string,
): Promise<number | null> {
  const res = await request.get("/api/v1/me/sessions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { items?: unknown[] };
  return body.items?.length ?? 0;
}

const E2E_SESSIONS_TWO_DEVICE_BODY = {
  status: "ok",
  items: [
    {
      session_token_suffix: "e2e01",
      is_current: true,
      created_at: "2026-01-01T00:00:00Z",
      last_seen_at: "2026-06-01T00:00:00Z",
    },
    {
      session_token_suffix: "e2e02",
      is_current: false,
      created_at: "2026-01-02T00:00:00Z",
      last_seen_at: "2026-06-01T12:00:00Z",
    },
  ],
};

function pathnameEndsWithSessionSuffix(url: string, suffix: string): boolean {
  try {
    const p = new URL(url).pathname.replace(/\/$/, "");
    return p.endsWith(`/api/v1/me/sessions/${suffix}`);
  } catch {
    return false;
  }
}

/** ① E2E 回退：API 无第二设备会话时，注入双会话列表 + 可撤销后缀 */
export async function installMeSessionsTwoDeviceRoute(page: Page): Promise<void> {
  await page.route("**/api/v1/me/sessions**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === "GET" && !url.includes("/current")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(E2E_SESSIONS_TWO_DEVICE_BODY),
      });
      return;
    }
    if (method === "DELETE" && url.replace(/\/$/, "").endsWith("/api/v1/me/sessions/current")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
      return;
    }
    if (method === "DELETE" && pathnameEndsWithSessionSuffix(url, "e2e02")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
      return;
    }
    await route.continue();
  });
}

/** @deprecated 使用 installMeSessionsTwoDeviceRoute（批次 17 双设备） */
export async function installMeSessionsRevokeRoute(page: Page): Promise<void> {
  await installMeSessionsTwoDeviceRoute(page);
}

/** ① E2E：空争议列表（`GET /api/v1/disputes` → `items: []`） */
export async function installEmptyDisputesListRoute(page: Page): Promise<void> {
  await page.route("**/api/v1/disputes**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        items: [],
        page: { limit: 500, has_more: false, next_cursor: null, source: "postgres" },
      }),
    });
  });
}

/** 用户争议列表首条 id（无则 null） */
export async function fetchFirstDisputeIdForBearer(
  request: APIRequestContext,
  apiBase: string,
  token: string,
): Promise<string | null> {
  const res = await request.get(`${apiBase}/api/v1/disputes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { items?: { id?: string }[] };
  const id = body.items?.[0]?.id?.trim();
  return id || null;
}

/** 浏览器内 patch `fetch` 模拟 Hub 状态条失败；`clear()` 切回成功 JSON（不依赖 Playwright route 与后端 sessions 路由）。 */
export async function installHubStatusApiFailureRoutes(page: Page) {
  await page.addInitScript(() => {
    type HubMockWindow = Window & {
      __ttHubStatusMockFail?: boolean;
      __ttHubStatusFetchPatched?: boolean;
    };
    const w = window as HubMockWindow;
    if (w.__ttHubStatusFetchPatched) return;
    w.__ttHubStatusFetchPatched = true;
    w.__ttHubStatusMockFail = true;

    const failBody = JSON.stringify({ status: "error", error: "hub_status_mock_fail" });
    const okSessionsBody = JSON.stringify({ status: "ok", items: [] });
    const okWalletBody = JSON.stringify({
      status: "ok",
      verified: false,
      verification_method: "eip191_personal_sign",
    });

    const orig = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (
        init?.method ?? (input instanceof Request ? input.method : "GET")
      ).toUpperCase();

      if (method === "GET" && url.includes("/api/v1/me/sessions")) {
        const body = w.__ttHubStatusMockFail ? failBody : okSessionsBody;
        const status = w.__ttHubStatusMockFail ? 500 : 200;
        return new Response(body, { status, headers: { "Content-Type": "application/json" } });
      }
      if (method === "GET" && url.includes("/api/v1/me/wallet/verification-status")) {
        const body = w.__ttHubStatusMockFail ? failBody : okWalletBody;
        const status = w.__ttHubStatusMockFail ? 500 : 200;
        return new Response(body, { status, headers: { "Content-Type": "application/json" } });
      }
      return orig(input, init);
    };
  });

  return {
    async clear() {
      await page.evaluate(() => {
        const w = window as Window & { __ttHubStatusMockFail?: boolean };
        w.__ttHubStatusMockFail = false;
      });
    },
  };
}
