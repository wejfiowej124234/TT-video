/**
 * 93 矩阵 · 业务风险 P1 页面补强（将 §5 中 smoke 未覆盖或仅浅覆盖的路由收敛为可门禁的 PASS/FAIL）。
 *
 * 映射（摘录）：
 * - **C-GOV-004**：`POST /auth/seed-governance-e2e`（与 `SEED_TEST_ACCOUNTS=1` 同源）后 **`chain_off_mvp`** 赞成可提交；**`governance_proposals_projection`** 则断言链上投票区与禁用链下按钮（无 SKIP）。
 * - **C-GOV-009**：应计列表等（与治理投票路径独立）。
 * - **B-MKT-002**：`/market` `StickyFilterBar` 筛选组可见（登录态）。
 * - **D-COM-004**：`/community/messages` 登录态主区域。
 * - **D-NET-001 / 13-1**：`/trust` 信任中心。
 * - **C-GOV-009**：`/governance/distribution-accruals` 与占位详情 id。
 * - **D-ADM-002 抽检扩展**：`/admin/trust-growth`、`cross-check`、`drift-summary`、`finance-reconciliation`、`region-vault`（占位 Cookie）。
 * - **B-NEG-002 对齐 UI**：非法订单 id 的托管页错误/加载可辨态。
 *
 * **证据目录模板**：`evidence/93-batch-p1-ui/<run_id>/`（HTTP 抓包可手工放入；Playwright 默认 `test-results/` + `npx playwright show-report`）。
 *
 * **复跑**（全栈，与仓库 `playwright.config` 一致）：
 * `cd frontend && PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/93-matrix-path-p1-remediation.spec.ts --project=chromium`
 */
import { test, expect, type Page } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { addSmokeAdminCookies } from "./helpers/smoke-nav";

const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

type GovernanceE2eSeedBody = {
  status?: string;
  mode?: string;
  proposal_id?: string;
};

/** **`POST /auth/seed-governance-e2e`**：与 **`seed-test-accounts`** 同源 **`SEED_TEST_ACCOUNTS=1`**（**C-GOV-004**）。 */
async function postSeedGovernanceE2e(
  request: import("@playwright/test").APIRequestContext,
  apiBase: string,
): Promise<{ mode: string; proposal_id: string }> {
  const res = await request.post(`${apiBase}/auth/seed-governance-e2e`, {
    headers: { "Content-Type": "application/json" },
    data: {},
  });
  const txt = await res.text();
  const hint404 =
    res.status() === 404
      ? `（HTTP 404 多为 ${apiBase} 上陈旧 API 未含本路由：结束占用端口的 traveltrust-api 后重跑，或 PLAYWRIGHT_REUSE_API_SERVER=0 且释放端口）`
      : "";
  expect(res.ok(), `POST /auth/seed-governance-e2e failed: HTTP ${res.status()} ${txt}${hint404}`).toBeTruthy();
  const j = JSON.parse(txt) as GovernanceE2eSeedBody;
  const mode = typeof j.mode === "string" ? j.mode.trim() : "";
  const proposalId = typeof j.proposal_id === "string" ? j.proposal_id.trim() : "";
  expect(mode.length, txt).toBeGreaterThan(0);
  expect(proposalId.length, txt).toBeGreaterThan(0);
  return { mode, proposal_id: proposalId };
}

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

/** 浏览器真登录（与 `gotoWithBearerSession` 互补，避免治理页首屏与 initStorage 竞态）。 */
async function uiLoginSeedTourist(page: Page, returnPath: string) {
  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(path)}`);
  await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
  await page.getByLabel(/password|密码/i).fill("Test123!");
  const expectedPath = new URL(path, "http://localhost").pathname;
  await Promise.all([
    page.waitForURL((u) => u.pathname === expectedPath, { timeout: 35_000 }),
    page.getByRole("button", { name: /Log in|登录/i }).click(),
  ]);
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({ timeout: 30_000 });
}

test.describe("93-matrix · P1 governance vote UI (C-GOV-004)", () => {
  test("登录态种子提案：赞成可提交且无 alert（API 模式）", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);

    const seed = await postSeedGovernanceE2e(request, apiBase);
    const proposalId = seed.proposal_id;
    const target = `/governance/proposals/${encodeURIComponent(proposalId)}`;
    await uiLoginSeedTourist(page, target);

    await expect(page.getByRole("heading", { level: 1, name: /Proposal detail|提案详情/i })).toBeVisible({
      timeout: 35_000,
    });
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
      timeout: 45_000,
    });

    const badProposalAlert = page.getByRole("alert").filter({
      hasText: /加载失败|Load failed|无效|invalid/i,
    });
    await expect(badProposalAlert).toBeHidden({ timeout: 25_000 });

    await expect(page.locator("#gov-prop-vote")).toBeVisible({
      timeout: 40_000,
    });

    const yesBtn = page.getByRole("button", { name: /Yes|赞成/i }).first();
    await expect(yesBtn).toBeVisible({ timeout: 25_000 });

    if (seed.mode === "governance_proposals_projection") {
      await expect(yesBtn).toBeDisabled({ timeout: 15_000 });
      await expect(
        page.getByText(/castVote|Governor mode|链上 Governor|钱包/i).first(),
      ).toBeVisible({ timeout: 35_000 });
      return;
    }

    expect(seed.mode, "unexpected seed mode").toBe("chain_off_mvp");

    await yesBtn.click();

    await expect.poll(async () => page.getByRole("alert").count(), { timeout: 20_000 }).toBe(0);

    await expect(page.locator("p").filter({ hasText: /我的投票|My vote/i }).first()).toContainText(
      /赞成|Yes/i,
      { timeout: 25_000 },
    );
  });
});

test.describe("93-matrix · P1 market filter + community messages (B-MKT-002 / D-COM-004)", () => {
  test("市场筛选条 + 私信列表（登录态）", async ({ page, request }) => {
    test.setTimeout(120_000);
    const apiBase = defaultApiBase();
    const health = await request.get(`${apiBase}/health`).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${apiBase}/health`);
    }

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    if (!creds?.token) {
      test.skip(true, "tourist@test 登录失败");
    }

    await gotoWithBearerSession(page, "/market", creds);
    await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("group", { name: /Market filters|自由市场筛选/i })).toBeVisible({
      timeout: 25_000,
    });

    await gotoWithBearerSession(page, "/community/messages", creds);
    await expect(page.getByRole("main", { name: /Messages|消息/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Messages|消息/i })).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("93-matrix · P1 trust + governance accruals (D-NET-001 / C-GOV-009)", () => {
  test("/trust 与应计列表、占位详情", async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto("/trust", { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /可验证的信任|Trust you can verify/i }),
    ).toBeVisible({ timeout: 25_000 });

    await page.goto("/governance/distribution-accruals", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /应计|Accruals|distribution narrative/i }),
    ).toBeVisible({
      timeout: 35_000,
    });
    await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible({
      timeout: 40_000,
    });

    const detailId = "00000000-0000-4000-8000-0000000000ac";
    await page.goto(`/governance/distribution-accruals/${detailId}`, { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /应计分录详情|Accrual distribution detail/i }),
    ).toBeVisible({ timeout: 35_000 });
  });
});

test.describe("93-matrix · P1 admin finance hub slice (D-ADM-002 extension)", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await addSmokeAdminCookies(page, baseURL);
  });

  test("信任增长、对拍、差异摘要、财务枢纽、RegionVault", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/admin/trust-growth", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /信任增长|Trust growth · Ops console/i }),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/cross-check", { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1, name: /多源对拍|Cross-check/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/admin/drift-summary", { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1, name: /差异摘要|Drift summary/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/admin/finance-reconciliation", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /财务.*只读枢纽|Finance.*read-only hub/i }),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/region-vault", { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /RegionVault|转出事件|forwarded events/i }),
    ).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("93-matrix · P1 escrow invalid id UI (B-NEG-002 surface)", () => {
  test("非法 UUID：订单详情主区域 + 错误提示", async ({ page }) => {
    await page.goto("/escrow/not-a-uuid", { timeout: 60_000 });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("main", { name: /Order details|订单详情/i })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 30_000 });
  });
});
