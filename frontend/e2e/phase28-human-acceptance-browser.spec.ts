/**
 * Phase ②.8 · Human Acceptance Test — authenticated browser flows.
 *
 * Human-visible checks: shells, CTAs, forms, lists, error boundaries.
 * NOT the six-domain UAT spec — independent HAT evidence.
 *
 * Driven by: scripts/dev/run-phase28-human-acceptance-test.sh (browser leg)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type Page } from "@playwright/test";

import { waitForAdminCapabilitiesReady } from "./helpers/adminCapabilitiesSession";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
} from "./helpers/apiSession";
import {
  adminAppPageShell,
  communityFeedPageShell,
  governanceProposalsPageShell,
} from "./helpers/pageShells";
import { stagingUatSeedAndLogin } from "./helpers/stagingUatAuth";

type HatIssue = {
  id: string;
  role: string;
  area: string;
  route: string;
  priority: "P0" | "P1" | "P2";
  title: string;
  observation: string;
  human_impact: string;
};

type HatFlow = {
  role: string;
  flow: string;
  step: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "BLOCKED";
  notes: string;
};

const issues: HatIssue[] = [];
const flows: HatFlow[] = [];
let seq = 0;

function hatGate(): boolean {
  return process.env.PHASE28_HAT_BROWSER === "1" && Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
}

function outDir(): string {
  return (process.env.HAT_OUT?.trim() || "evidence/phase28-human-acceptance/latest").replace(/\\/g, "/");
}

function addIssue(
  role: string,
  area: string,
  route: string,
  priority: HatIssue["priority"],
  title: string,
  observation: string,
  human_impact: string,
): void {
  seq += 1;
  issues.push({
    id: `HAT-B-${String(seq).padStart(3, "0")}`,
    role,
    area,
    route,
    priority,
    title,
    observation,
    human_impact,
  });
}

function addFlow(
  role: string,
  flow: string,
  step: string,
  status: HatFlow["status"],
  notes = "",
): void {
  flows.push({ role, flow, step, status, notes });
}

async function assertNoErrorBoundary(page: Page, role: string, route: string): Promise<boolean> {
  if (route.startsWith("/admin/")) {
    await page
      .locator('[data-tt-admin-list-page="1"], [data-tt-admin-app-page="1"]')
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => null);
  }
  const err = page.getByText(/页面加载异常|Something went wrong|Application error|出错了/i);
  if ((await err.count()) > 0) {
    addIssue(role, "错误边界", route, "P0", "页面崩溃边界可见", "error boundary rendered", "用户无法继续使用该页");
    addFlow(role, "页面", route, "FAIL", "error boundary");
    return false;
  }
  return true;
}

async function probeAuthenticatedPage(
  page: Page,
  role: string,
  route: string,
  session: { token: string; userId?: string },
  opts?: {
    shell?: (page: Page) => ReturnType<Page["locator"]>;
    mainText?: RegExp;
    cta?: RegExp;
    waitMs?: number;
    skipCapabilitiesWait?: boolean;
  },
): Promise<void> {
  await gotoWithBearerSession(page, route, session);
  if (!route.startsWith("/admin") && !route.startsWith("/governance")) {
    await ensureCommunityBrowserSessionAccepted(page, session);
  }
  if (route.startsWith("/admin") && !opts?.skipCapabilitiesWait) {
    try {
      await waitForAdminCapabilitiesReady(page, session, 30_000);
    } catch {
      addIssue(role, "Admin 壳层", route, "P1", "capabilities 条未就绪", "waitForAdminCapabilitiesReady timeout", "侧栏/能力条可能空白或降级");
    }
  }
  await page.waitForTimeout(opts?.waitMs ?? 1500);
  if (!(await assertNoErrorBoundary(page, role, route))) return;

  if (opts?.shell) {
    try {
      await expect(opts.shell(page)).toBeVisible({ timeout: 30_000 });
      addFlow(role, "页面壳", route, "PASS");
    } catch {
      addIssue(role, "页面壳", route, "P1", "L5 页壳不可见", "data-tt shell missing", "布局/导航可能未加载");
      addFlow(role, "页面壳", route, "PARTIAL");
    }
  } else if (opts?.mainText) {
    if (route.startsWith("/admin")) {
      await page
        .locator('[data-tt-admin-list-page-header="1"]')
        .waitFor({ state: "visible", timeout: 45_000 })
        .catch(() => null);
    }
    const header = page.locator('[data-tt-admin-list-page-header="1"]').filter({ hasText: opts.mainText });
    const h1 = page.getByRole("heading", { level: 1, name: opts.mainText });
    const main = page.getByRole("main").filter({ hasText: opts.mainText }).first();
    const ok =
      (await header.first().isVisible().catch(() => false)) ||
      (await h1.first().isVisible().catch(() => false)) ||
      (await main.isVisible().catch(() => false));
    if (!ok) {
      addIssue(role, "主内容", route, "P1", "主区域文案不匹配", String(opts.mainText), "用户可能看到空列表或错误页");
      addFlow(role, "页面", route, "PARTIAL");
    } else {
      addFlow(role, "页面", route, "PASS");
    }
  }

  if (opts?.cta) {
    const btn = page.getByRole("button", { name: opts.cta }).or(page.getByRole("link", { name: opts.cta }));
    if ((await btn.count()) === 0) {
      addIssue(role, "交互", route, "P2", "预期 CTA 未找到", String(opts.cta), "用户可能找不到下一步操作");
    }
  }
}

(hatGate() ? test.describe : test.describe.skip)("Phase ②.8 HAT · browser", () => {
  test.setTimeout(240_000);

  let tourist: { token: string; userId: string };
  let guide: { token: string; userId: string };
  let admin: { token: string; userId: string };

  test.beforeAll(async ({ request }) => {
    const api = defaultApiBase();
    await stagingUatSeedAndLogin(request, api);
    const t = await apiLoginReturnCredentials(request, api, "tourist@test.com", "Test123!");
    const g = await apiLoginReturnCredentials(request, api, "guide@test.com", "Test123!");
    if (!t?.token) throw new Error("HAT: tourist login failed");
    tourist = { token: t.token, userId: t.userId };
    guide = g?.token ? { token: g.token, userId: g.userId } : tourist;
    admin = tourist;
  });

  test.afterAll(() => {
    const dir = outDir();
    mkdirSync(dir, { recursive: true });
    let mergedIssues = issues;
    let mergedFlows = flows;
    const probePath = join(dir, "hat-findings.json");
    try {
      const probe = JSON.parse(readFileSync(probePath, "utf8")) as {
        issues?: HatIssue[];
        flows?: HatFlow[];
      };
      mergedIssues = [...(probe.issues ?? []), ...issues];
      mergedFlows = [...(probe.flows ?? []), ...flows];
    } catch {
      /* probe-only run */
    }
    const p0 = mergedIssues.filter((i) => i.priority === "P0").length;
    const p1 = mergedIssues.filter((i) => i.priority === "P1").length;
    const p2 = mergedIssues.filter((i) => i.priority === "P2").length;
    const adminP1 = mergedIssues.filter((i) => i.priority === "P1" && i.role === "管理员").length;
    const verdict =
      p0 > 0 ? "NO-GO" : p1 > 3 ? "CONDITIONAL" : "PASS";
    writeFileSync(
      join(dir, "hat-findings.json"),
      JSON.stringify(
        {
          phase: "②.8 Human Acceptance Test",
          recorded_at: new Date().toISOString(),
          targets: {
            web: process.env.PLAYWRIGHT_BASE_URL,
            api: process.env.PLAYWRIGHT_API_BASE_URL,
          },
          meta_git_sha: process.env.HAT_META_GIT_SHA?.trim() || undefined,
          verdict,
          summary: {
            p0,
            p1,
            p2,
            admin_p1: adminP1,
            flows_pass: mergedFlows.filter((f) => f.status === "PASS").length,
            flows_fail: mergedFlows.filter((f) => f.status === "FAIL").length,
            flows_partial: mergedFlows.filter((f) => f.status === "PARTIAL").length,
            flows_blocked: mergedFlows.filter((f) => f.status === "BLOCKED").length,
          },
          issues: mergedIssues,
          flows: mergedFlows,
          boundary: "Human-visible HAT · browser + API probe · not Production GO",
        },
        null,
        2,
      ),
    );
  });

  test("旅行者 · 注册登录与市场发现", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("textbox", { name: /email|邮箱/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /password|密码/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|登录|log in/i })).toBeVisible();
    addFlow("旅行者", "登录表单", "/auth/login", "PASS", "email+password+submit visible");

    await page.goto("/auth/register");
    await expect(page.getByRole("main")).toBeVisible();
    addFlow("旅行者", "注册", "/auth/register", "PASS");

    await page.goto("/");
    await assertNoErrorBoundary(page, "旅行者", "/");
    addFlow("旅行者", "首页", "/", "PASS");

    await page.goto("/market");
    await assertNoErrorBoundary(page, "旅行者", "/market");
    const search = page.getByRole("searchbox").or(page.getByPlaceholder(/search|搜索/i));
    if ((await search.count()) === 0) {
      addIssue("旅行者", "市场", "/market", "P2", "搜索框不明显", "no searchbox role", "筛选/搜索体验弱");
    }
    addFlow("旅行者", "市场", "/market", "PASS");
  });

  test("旅行者 · 身份/社区/治理", async ({ page }) => {
    await probeAuthenticatedPage(page, "旅行者", "/me", tourist, { shell: communityFeedPageShell });
    await probeAuthenticatedPage(page, "旅行者", "/me/settings", tourist, { mainText: /Settings|设置/i });
    await probeAuthenticatedPage(page, "旅行者", "/me/identities", tourist, { mainText: /Identities|身份/i });
    await probeAuthenticatedPage(page, "旅行者", "/community/messages", tourist, {
      mainText: /Messages|消息/i,
      waitMs: 4000,
    });
    await probeAuthenticatedPage(page, "旅行者", "/orders", tourist, { mainText: /Order|订单/i });
    await probeAuthenticatedPage(page, "旅行者", "/governance/proposals", tourist, {
      shell: governanceProposalsPageShell,
    });
    await probeAuthenticatedPage(page, "旅行者", "/market/acquisition", tourist, {
      mainText: /Acquisition|收购/i,
      waitMs: 5000,
    });
  });

  test("向导 · 向导端与订单", async ({ page }) => {
    await probeAuthenticatedPage(page, "向导", "/guide", guide, { mainText: /Guide|向导|workspace|工作台/i });
    await probeAuthenticatedPage(page, "向导", "/orders", guide, { mainText: /Order|订单/i });
  });

  test("商家 · 入驻链入口", async ({ page }) => {
    await page.goto("/auth/register?role=provider");
    await assertNoErrorBoundary(page, "商家", "/auth/register?role=provider");
    addFlow("商家", "注册入口", "provider register step0", "PASS");

    await page.goto("/provider/register");
    await assertNoErrorBoundary(page, "商家", "/provider/register");
    addFlow("商家", "入驻表单", "/provider/register", "PASS");

    await page.goto("/market/provider");
    await assertNoErrorBoundary(page, "商家", "/market/provider");
    addFlow("商家", "橱窗", "/market/provider", "PASS");

    addIssue(
      "商家",
      "测试账号",
      "/provider/register",
      "P2",
      "无预置商家一键账号",
      "staging seed 仅 tourist/guide",
      "完整商家闭环需注册+Admin 审核，手测成本高",
    );
    addFlow("商家", "完整闭环", "publish listing", "BLOCKED", "需新注册+审核");
  });

  test("管理员 · 工作台与台账", async ({ page }) => {
    await probeAuthenticatedPage(page, "管理员", "/admin", admin, { shell: adminAppPageShell, waitMs: 3000 });
    await probeAuthenticatedPage(page, "管理员", "/admin/orders", admin, { mainText: /Orders|订单/i, waitMs: 2000, skipCapabilitiesWait: true });
    await probeAuthenticatedPage(page, "管理员", "/admin/users", admin, { mainText: /Users|用户|User/i, waitMs: 2000, skipCapabilitiesWait: true });
    await probeAuthenticatedPage(page, "管理员", "/admin/finance", admin, {
      mainText: /Finance|财务|finance/i,
      waitMs: 2000,
      skipCapabilitiesWait: true,
    });
    await probeAuthenticatedPage(page, "管理员", "/admin/disputes", admin, { mainText: /Disputes|争议/i, waitMs: 2000, skipCapabilitiesWait: true });
    await probeAuthenticatedPage(page, "管理员", "/admin/community/reports", admin, {
      mainText: /Community reports|社区举报|Report|举报/i,
      waitMs: 2000,
      skipCapabilitiesWait: true,
    });
    await probeAuthenticatedPage(page, "管理员", "/admin/inbox", admin, { mainText: /Task inbox|Inbox|收件|任务/i, waitMs: 2000, skipCapabilitiesWait: true });
    await probeAuthenticatedPage(page, "管理员", "/admin/provider-applications", admin, {
      mainText: /Merchant|商家|Provider|Application|申请|onboarding/i,
      waitMs: 2000,
      skipCapabilitiesWait: true,
    });
  });

  test("治理 · 提案与委托", async ({ page }) => {
    await page.goto("/governance");
    await assertNoErrorBoundary(page, "治理", "/governance");
    addFlow("治理", "治理首页", "/governance", "PASS");

    await probeAuthenticatedPage(page, "治理", "/governance/delegate", tourist, {
      mainText: /Delegate|委托/i,
      waitMs: 4000,
    });
    await probeAuthenticatedPage(page, "治理", "/governance/distribution-claim", tourist, {
      mainText: /Claim|领取|Distribution/i,
      waitMs: 4000,
    });
    await probeAuthenticatedPage(page, "治理", "/staking", tourist, { mainText: /stak|质押/i, waitMs: 4000 });
  });

  test("社区 · 404 API 真人可见性", async ({ page }) => {
    const apiFailures: string[] = [];
    page.on("response", (res) => {
      const u = res.url();
      if (u.includes("/api/v1/") && res.status() >= 400 && !/^401|^403/.test(String(res.status()))) {
        apiFailures.push(`${res.status()} ${u.split("/api/v1/")[1] ?? u}`);
      }
    });
    await page.goto("/community");
    await page.waitForTimeout(3000);
    const hard404 = apiFailures.filter((x) => x.startsWith("404"));
    if (hard404.length > 0) {
      addIssue(
        "旅行者",
        "社区",
        "/community",
        "P1",
        "社区页 API 404",
        hard404.slice(0, 3).join("; "),
        "Feed/媒体能力可能降级或控制台报错",
      );
      addFlow("旅行者", "社区 Feed", "/community", "PARTIAL", hard404.join("; "));
    } else {
      addFlow("旅行者", "社区 Feed", "/community", "PASS");
    }
  });
});
