/**
 * 07 §5.1 + §5.6A / 130：争议详情页仲裁区：
 * - 仲裁员：POST resolve 错误文案与 `handleResolve` / `mapApiReadError` → `mapOrderWriteError` 一致。
 * - 非仲裁员（旅行者/向导）：仅展示 `dispute_resolveArbitratorOnly`，无「提交裁决」按钮（RBAC · 13-1）。
 * 全程 mock API。
 */
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const DISPUTE_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ORDER_ID = "99999999-9999-4999-8999-999999999999";
const ARBITRATOR_USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
/** 与仲裁员用例分路由，避免并行 worker 下 `page.route` 路径撞车 */
const DISPUTE_NON_ARB = "11111111-1111-4111-8111-111111111111";
const ORDER_NON_ARB = "22222222-2222-4222-8222-222222222222";
const TOURIST_USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const GUIDE_ROW_ID = "33333333-3333-4333-8333-333333333333";
const GUIDE_USER_ID = "44444444-4444-4444-8444-444444444444";

type ResolveScenario =
  | "resolve_only_arbitrator_api"
  | "resolve_db_persist_failed"
  | "resolve_trust_pending";

function installDisputeResolveMocks(page: Page, scenario: ResolveScenario) {
  return page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname === "/meta" || u.pathname.startsWith("/api/v1/");
    } catch {
      return false;
    }
  }, async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/meta" && method === "GET") {
      return json({ status: "ok", note: "e2e-mock-dispute-resolve" });
    }

    if (path === "/api/v1/me" && method === "GET") {
      return json({
        status: "ok",
        user: {
          id: ARBITRATOR_USER_ID,
          email: "arb@traveltrust.test",
          role: "arbitrator",
        },
        guide: null,
        trust: {},
        stats: {},
      });
    }

    if (path === `/api/v1/disputes/${DISPUTE_ID}` && method === "GET") {
      return json({
        status: "ok",
        dispute: {
          id: DISPUTE_ID,
          order_id: ORDER_ID,
          status: "pending",
          evidence_hashes: [],
          created_at: "2026-01-01T00:00:00.000Z",
        },
      });
    }

    if (path === `/api/v1/orders/${ORDER_ID}/evidence` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    if (path === `/api/v1/disputes/${DISPUTE_ID}/resolve` && method === "POST") {
      if (scenario === "resolve_only_arbitrator_api") {
        return json(
          { error: "only_arbitrator_can_resolve", message: "only_arbitrator_can_resolve" },
          403
        );
      }
      if (scenario === "resolve_db_persist_failed") {
        return json(
          {
            error: "dispute_resolve_db_persist_failed",
            message: "dispute_resolve_db_persist_failed",
          },
          503
        );
      }
      if (scenario === "resolve_trust_pending") {
        return json(
          { error: "trust_verification_pending", message: "trust_verification_pending" },
          403
        );
      }
      return json({ status: "ok", dispute: { id: DISPUTE_ID, status: "resolved" } });
    }

    return route.continue();
  });
}

function arbSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: /仲裁员裁决|Arbitrator resolve/i }),
  });
}

test.describe("争议详情页裁决提交错误文案（mock API · 仲裁员）", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((uid) => {
      window.localStorage.setItem("traveltrust_user_id", uid);
    }, ARBITRATOR_USER_ID);
  });

  test("POST resolve 403 only_arbitrator_can_resolve → 仅仲裁员文案", async ({ page }) => {
    await installDisputeResolveMocks(page, "resolve_only_arbitrator_api");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = arbSection(page);
    await expect(section).toBeVisible({ timeout: 45_000 });
    const resolveBtn = section.getByRole("button", { name: /提交裁决|Submit resolution/i });
    await expect(resolveBtn).toBeVisible({ timeout: 60_000 });
    await resolveBtn.click();

    await expect(section.locator("p.text-danger")).toContainText(
      /仅仲裁员账号可提交裁决|Only an arbitrator account can submit/i
    );
  });

  test("POST resolve 503 dispute_resolve_db_persist_failed → DB 不可用文案", async ({ page }) => {
    await installDisputeResolveMocks(page, "resolve_db_persist_failed");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = arbSection(page);
    await expect(section).toBeVisible({ timeout: 45_000 });
    const resolveBtn = section.getByRole("button", { name: /提交裁决|Submit resolution/i });
    await expect(resolveBtn).toBeVisible({ timeout: 60_000 });
    await resolveBtn.click();

    await expect(section.locator("p.text-danger")).toContainText(
      /裁决未能完整写入数据库|Resolution could not be fully persisted|Idempotency-Key/i
    );
  });

  test("POST resolve 403 trust_verification_pending → 信任提示", async ({ page }) => {
    await installDisputeResolveMocks(page, "resolve_trust_pending");
    await page.goto(`/disputes/${DISPUTE_ID}`);

    await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

    const section = arbSection(page);
    await expect(section).toBeVisible({ timeout: 45_000 });
    const resolveBtn = section.getByRole("button", { name: /提交裁决|Submit resolution/i });
    await expect(resolveBtn).toBeVisible({ timeout: 60_000 });
    await resolveBtn.click();

    await expect(section.locator("p.text-danger")).toContainText(
      /身份核验仍在处理中|identity verification is still in progress/i
    );
  });
});

type NonArbRole = "tourist" | "guide";

function installDisputeNonArbitratorMocks(page: Page, role: NonArbRole) {
  return page.route((url) => {
    try {
      const u = new URL(url);
      return u.pathname === "/meta" || u.pathname.startsWith("/api/v1/");
    } catch {
      return false;
    }
  }, async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/meta" && method === "GET") {
      return json({ status: "ok", note: "e2e-mock-dispute-non-arb" });
    }

    if (path === "/api/v1/me" && method === "GET") {
      if (role === "tourist") {
        return json({
          status: "ok",
          user: {
            id: TOURIST_USER_ID,
            email: "tourist@traveltrust.test",
            role: "tourist",
          },
          guide: null,
          trust: {},
          stats: {},
        });
      }
      return json({
        status: "ok",
        user: {
          id: GUIDE_USER_ID,
          email: "guide@traveltrust.test",
          role: "guide",
        },
        guide: { id: GUIDE_ROW_ID, wallet_address: "0x2222222222222222222222222222222222222222" },
        trust: {},
        stats: {},
      });
    }

    if (path === `/api/v1/disputes/${DISPUTE_NON_ARB}` && method === "GET") {
      return json({
        status: "ok",
        dispute: {
          id: DISPUTE_NON_ARB,
          order_id: ORDER_NON_ARB,
          status: "pending",
          evidence_hashes: [],
          created_at: "2026-01-01T00:00:00.000Z",
        },
      });
    }

    if (path === `/api/v1/orders/${ORDER_NON_ARB}/evidence` && method === "GET") {
      return json({ status: "ok", items: [] });
    }

    return route.continue();
  });
}

test.describe("争议详情页仲裁区只读（mock API · 非仲裁员）", () => {
  for (const role of ["tourist", "guide"] as const) {
    test(`${role}：展示非仲裁员说明且无「提交裁决」按钮`, async ({ page }) => {
      const uid = role === "tourist" ? TOURIST_USER_ID : GUIDE_USER_ID;
      await page.addInitScript((id) => {
        window.localStorage.setItem("traveltrust_user_id", id);
      }, uid);

      await installDisputeNonArbitratorMocks(page, role);
      await page.goto(`/disputes/${DISPUTE_NON_ARB}`);

      await expect(page.getByRole("main")).toBeVisible({ timeout: 60_000 });

      const readOnlyArb = page.locator("section").filter({
        has: page.getByText(/当前账号不是仲裁员|not an arbitrator; you cannot submit/i),
      });
      await expect(
        readOnlyArb.getByRole("heading", { name: /仲裁员裁决|Arbitrator resolve/i })
      ).toBeVisible();
      await expect(
        readOnlyArb.getByRole("button", { name: /提交裁决|Submit resolution/i })
      ).toHaveCount(0);
    });
  }
});
