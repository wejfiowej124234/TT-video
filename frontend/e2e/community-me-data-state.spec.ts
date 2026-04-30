/**
 * P1：`/community/me` 系 DataState 审计 DOM（`data-tt-*`）与关键语义回归（invalid / error / empty）。
 * 含 `tab=community_posts` 深链 + API 发帖 → 抽屉与 `GET …/me/posts` 对齐（95 · F-019 闭环抽检）。
 * 依赖本地 `npm run dev` 或 CI webServer；全栈时 `PLAYWRIGHT_FULL_STACK=1`。
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

const communityMeNavTimeoutMs = process.env.PLAYWRIGHT_E2E_STABILITY === "1" ? 120_000 : 60_000;
/** 访客闸须等 `getMeFull` 结束；冷编 + 稳定性门禁下 20s 易假红 */
const communityMeAuditVisibleMs =
  process.env.PLAYWRIGHT_E2E_STABILITY === "1" || process.env.CI === "true" ? 90_000 : 25_000;

test.describe("community/me · DataState audit (P1)", () => {
  test.describe.configure({
    timeout: process.env.PLAYWRIGHT_E2E_STABILITY === "1" || process.env.CI === "true" ? 180_000 : 100_000,
  });

  /** 与 smoke 举报用例同源：残留 Cookie/会话会令 `getMeFull` 真登录，访客闸永不出现 */
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("访客：鉴权闸 invalid 暴露 data-tt", async ({ page }) => {
    await page.goto("/community/me", { timeout: communityMeNavTimeoutMs });
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_auth_gate"][data-tt-data-state="invalid"]'),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("举报列表访客：鉴权闸 invalid 暴露 data-tt", async ({ page }) => {
    await page.goto("/community/me/reports", { timeout: communityMeNavTimeoutMs });
    await expect(
      page.locator(
        '[data-tt-community-me-surface="community_me_reports_auth_gate"][data-tt-data-state="invalid"]',
      ),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("访客：社区帖子抽屉深链展示 IA scope 徽章（非市场目录）", async ({ page }) => {
    await page.goto("/community/me?tab=posts", { timeout: communityMeNavTimeoutMs });
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: communityMeAuditVisibleMs });
    await expect(page.getByRole("heading", { level: 2, name: /社区帖子|Community posts/i })).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect(
      page.getByText(/非自由市场可售目录|not the marketplace catalog/i),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("赞过列表访客：鉴权闸 invalid 暴露 data-tt", async ({ page }) => {
    await page.goto("/community/me", { timeout: communityMeNavTimeoutMs });
    const likesTab = page.getByRole("button", { name: /赞过|Liked/i });
    if ((await likesTab.count()) === 0) {
      test.skip(true, "赞过 Tab 未展示（如 NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST=0）");
    }
    await likesTab.click();
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_likes_auth_gate"][data-tt-data-state="invalid"]'),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("举报详情：非法 id → invalid 暴露 data-tt", async ({ page, request }) => {
    test.setTimeout(90_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "seed 登录失败");
    }
    await gotoWithBearerSession(page, "/community/me/reports/not-a-uuid", creds);
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_report_detail"][data-tt-data-state="invalid"]'),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("已登录：拦截 following API → 社交统计条 error 暴露 data-tt", async ({ page, request }) => {
    test.setTimeout(90_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "seed 登录失败");
    }
    await page.route("**/api/v1/community/me/following**", (route) => route.abort());
    await gotoWithBearerSession(page, "/community/me", creds);
    /** 已登录页 `h1` 为昵称/ID，非「个人中心」；`main` 与资料卡 surface 与 i18n 对齐 */
    await expect(page.getByRole("main", { name: /Profile|个人中心/i })).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect(page.locator('[data-tt-community-me-surface="community_me_profile"]')).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_social_stats"][data-tt-data-state="error"]'),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
  });

  test("已登录：likes-received 契约畸形 → 社交统计条 success + 部分提示 + 获赞为 —", async ({ page, request }) => {
    test.setTimeout(90_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "seed 登录失败");
    }
    await page.route("**/api/v1/community/me/likes-received**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });
    await gotoWithBearerSession(page, "/community/me", creds);
    await expect(page.getByRole("main", { name: /Profile|个人中心/i })).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect(page.locator('[data-tt-community-me-surface="community_me_profile"]')).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect(
      page.locator('[data-tt-community-me-surface="community_me_social_stats"][data-tt-data-state="success"]'),
    ).toBeVisible({ timeout: communityMeAuditVisibleMs });
    const likesMetric = page.locator('[aria-label*="帖子获赞"], [aria-label*="Likes received"]');
    if ((await likesMetric.count()) === 0) {
      test.skip(true, "获赞列未展示（如构建关闭 NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST）");
    }
    await expect(page.getByRole("status").filter({ hasText: /部分社交|Some social stats/i })).toBeVisible({
      timeout: 15_000,
    });
    const dashCell = page.locator('[aria-label*="不可用"], [aria-label*="unavailable"]').first();
    await expect(dashCell).toBeVisible({ timeout: 10_000 });
  });

  test("已登录：`tab=community_posts` 深链 + API 发帖 → 抽屉橱窗含正文", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "seed 登录失败");
    }
    const stamp = Date.now();
    const bodyText = `me-posts-drawer-${stamp}`;
    const idem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `me-com-${stamp}`;
    const createRes = await request.post(`${apiBase}/api/v1/community/posts`, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idem,
      },
      data: { post_type: "text", body: bodyText },
    });
    if (!createRes.ok()) {
      test.skip(true, await createRes.text());
    }
    const created = (await createRes.json()) as { id?: string; status?: string };
    if (created.status !== "ok" || !(created.id ?? "").trim()) {
      test.skip(true, "发帖未返回 ok/id");
    }
    await gotoWithBearerSession(page, `/community/me?tab=community_posts`, creds);
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: communityMeAuditVisibleMs });
    await expect(page.getByRole("heading", { level: 2, name: /社区帖子|Community posts/i })).toBeVisible({
      timeout: communityMeAuditVisibleMs,
    });
    await expect
      .poll(async () => (await page.getByRole("dialog").innerText()).includes(bodyText), { timeout: 45_000 })
      .toBe(true);
  });
});
