/**
 * 管理后台烟雾（续）：自 `smoke-admin.spec.ts` 拆分 —— 配置中心 / 社区策略与媒体 / 占位详情 / DSAR 子页。
 * 断言、`traveltrust_user_id` Cookie 与 `gotoSmoke`（默认 load）与拆分前一致；见 `e2e/helpers/smoke-nav.ts`。
 */
import { test, expect } from "@playwright/test";
import { addSmokeAdminCookies, adminAppPageMainLocator, gotoSmoke } from "./helpers/smoke-nav";

/** 与列表页一致的占位 UUID；仅验证动态路由与详情壳渲染（API 可 404）。 */
const ADMIN_DETAIL_PLACEHOLDER_ID = "00000000-0000-4000-8000-0000000000ad";

test.describe("管理后台烟雾·配置/策略/详情（自 smoke-admin.spec.ts 拆分 · 同一 Cookie 与断言）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test.describe("管理后台配置中心、任务调度与社区运营扩展（07 §5.8·Wave·160·70 可达性）", () => {
    test("Admin 配置中心页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/config");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Config center|配置中心/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 功能开关页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/flags");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Feature flags|功能开关/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 异步任务队列页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/jobs");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Async jobs|异步任务队列/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 配置发布登记页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/config/releases");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Config releases|配置发布登记/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 调度运行记录页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/scheduler/jobs");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Scheduler job runs|调度运行记录/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin Secret 元数据页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/secrets/metadata");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Secret metadata|Secret 元数据/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 租户与区域作用域页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/tenants/scopes");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Tenant & region scopes|租户与区域作用域/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区申诉台账页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/appeals");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Community appeals|社区申诉台账/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区审核审计行页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/moderation/cases");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /Community moderation cases|社区审核审计行/i,
        }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区风险信号页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/risk-signals");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Community risk signals|社区风险信号/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin API 版本页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/api-versions");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /API versions|API 版本/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });
  });

  test.describe("管理后台社区策略、生命周期、策略与媒体审计（160 / 70 / 07 §5.3B·§5.6C 可达性·补全）", () => {
    test("Admin 社区策略变更审计页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/policy-change-logs");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /Community policy change logs|社区策略变更审计/i,
        }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin Feed 排序快照页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/ranking/snapshots");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Feed ranking snapshots|Feed 排序快照/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区处罚台账页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/penalties");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Community penalties|社区处罚台账/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 评论可见性页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/comments/visibility");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Comment visibility|评论可见性/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区滥用策略页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/abuse-policy");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Community abuse policy|社区滥用策略/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 生命周期状态机页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/lifecycle");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Lifecycle state machines|生命周期状态机/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 数据权限策略页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/policies");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Data policies|数据权限策略/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 内部工具审计页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/internal-tools/audits");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Internal tool audits|内部工具审计/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 媒体访问审计页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/media/access-logs");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Media access logs|媒体访问审计/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 签名 URL 令牌台账页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/media/signed-url-tokens");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /Signed URL tokens|签名 URL 令牌台账/i,
        }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 社区申诉复核页可访问", async ({ page }) => {
      await gotoSmoke(page, "/admin/community/appeals/review");
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Community appeal review|社区申诉复核/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });
  });

  test.describe("管理后台占位详情与单条报告页（70 / 110 / 07 §5.1·§5.6A·§5.7 路由可达）", () => {
    test("Admin 订单详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/orders/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Order detail|订单详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 争议详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/disputes/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Admin dispute detail|Admin 争议详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 用户详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/users/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /User detail|用户详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 向导详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/guides/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Admin guide detail|Admin 向导详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 评价详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/reviews/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Admin review detail|Admin 评价详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 审批单详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/approvals/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Approval request detail|审批单详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 审计日志详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/audit/logs/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Audit log detail|审计日志详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 索引器对账报告详情页可访问（占位 report id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/indexer/reconcile/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Indexer reconcile report|索引器对账报告/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 配置发布详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/config/releases/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Config release|配置发布详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin 告警 incident 详情页可访问（占位 id）", async ({ page }) => {
      await gotoSmoke(page, `/admin/alerts/incidents/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /Alert incident detail|告警 incident 详情/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });
  });

  test.describe("管理后台 DSAR 合规子页（500 / 70 / 07 §5.6C 可达性）", () => {
    test("Admin DSAR 事件轴页可访问（占位 requestId）", async ({ page }) => {
      const rid = ADMIN_DETAIL_PLACEHOLDER_ID;
      await gotoSmoke(page, `/admin/compliance/requests/${encodeURIComponent(rid)}/events`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /DSAR event timeline|DSAR 事件轴/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });

    test("Admin DSAR 登记更新页可访问（占位 requestId）", async ({ page }) => {
      const rid = ADMIN_DETAIL_PLACEHOLDER_ID;
      await gotoSmoke(page, `/admin/compliance/requests/${encodeURIComponent(rid)}/update`);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: /DSAR update|DSAR 登记更新/i }),
      ).toBeVisible({ timeout: 90_000 });
      await expect(adminAppPageMainLocator(page).first()).toBeVisible({ timeout: 90_000 });
    });
  });
});
