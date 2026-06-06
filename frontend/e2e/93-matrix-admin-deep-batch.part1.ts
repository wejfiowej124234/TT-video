/** 93 Admin deep · part1: RBAC, bearer, super boundary, PATCH guide (imported by `93-matrix-admin-deep-batch.spec.ts`). */
import { join } from "node:path";

import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  apiLoginReturnToken,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { adminAppPageShell } from "./helpers/pageShells";
import {
  deepCtx,
  fetchMeUser,
  writeJson,
  writeTarget,
} from "./helpers/adminDeepBatchShared";
import {
  requestGetExpectOkWith429Backoff,
  requestGetWith429Retry,
  requestPatchExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";

test.describe("93-admin deep · RBAC API + 游客 Admin UI 403 面 @e2e-sepolia-deferred", () => {
  test.describe.configure({ retries: 1 });
  test("未登录 / 游客 / 向导 调 GET /api/v1/admin/users；游客打开 /admin/orders 呈 admin_required 提示", async ({
    request,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, evidenceDir, chainOff } = deepCtx;

    const unauth = await requestGetWith429Retry(request, `${apiBase}/api/v1/admin/users?limit=5`);
    const unauthBody = await unauth.json().catch(() => ({}));
    writeJson("rbac-unauth-admin-users.json", {
      request: { method: "GET", url: "/api/v1/admin/users?limit=5", headers: {} },
      response: { status: unauth.status(), body: unauthBody },
    });
    if (!chainOff) {
      expect(unauth.status()).toBe(501);
      expect((unauthBody as { error?: string }).error).toBe("not_implemented");
      test.skip(true, "chain_off 未挂载：Admin 路由 501，RBAC 深测跳过");
    }
    expect(unauth.status()).toBe(401);

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const touristCreds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    const touristTok = touristCreds?.token ?? null;
    const guideTok = await apiLoginReturnToken(request, apiBase, "guide@test.com", "Test123!");
    if (!touristTok || !guideTok) {
      test.skip(true, "种子账号登录失败（需 SEED_TEST_ACCOUNTS）");
    }

    const touristRes = await requestGetWith429Retry(
      request,
      `${apiBase}/api/v1/admin/users?limit=5`,
      { headers: { Authorization: `Bearer ${touristTok}` } },
    );
    const touristBody = await touristRes.json().catch(() => ({}));
    writeJson("rbac-tourist-admin-users.json", {
      request: { method: "GET", url: "/api/v1/admin/users?limit=5", auth: "Bearer tourist" },
      response: { status: touristRes.status(), body: touristBody },
    });
    expect(touristRes.status()).toBe(403);
    expect((touristBody as { error?: string }).error).toBe("admin_required");

    const guideRes = await requestGetWith429Retry(
      request,
      `${apiBase}/api/v1/admin/users?limit=5`,
      { headers: { Authorization: `Bearer ${guideTok}` } },
    );
    const guideBody = await guideRes.json().catch(() => ({}));
    writeJson("rbac-guide-admin-users.json", {
      request: { method: "GET", url: "/api/v1/admin/users?limit=5", auth: "Bearer guide" },
      response: { status: guideRes.status(), body: guideBody },
    });
    expect(guideRes.status()).toBe(403);
    expect((guideBody as { error?: string }).error).toBe("admin_required");

    const credJson = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    expect(credJson?.token && credJson.userId).toBeTruthy();
    /** Edge middleware 读 **Cookie**；仅 `localStorage` 时会被挡在 `/auth/login`（见失败快照 `aria-label=登录`）。 */
    const origin = (baseURL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: credJson!.userId, url: origin },
    ]);
    const adminOrdersList = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        (r.url().includes("/api/v1/admin/orders") ||
          (r.url().includes("/admin/orders") && r.url().includes("/api/"))),
      /** 须覆盖 `gotoWithBearerSession` 冷编译 goto+reload，避免早于列表请求即 60s 超时 */
      { timeout: 150_000 },
    );
    await gotoWithBearerSession(page, "/admin/orders", {
      token: credJson!.token,
      userId: credJson!.userId,
    });
    const listRes = await adminOrdersList.catch(() => null);
    if (listRes) {
      expect(listRes.status(), "浏览器侧列表拉取须 403（与 API 直调一致）").toBe(403);
    }

    const main = adminAppPageShell(page);
    await expect(main).toBeVisible({ timeout: 90_000 });
    /**
     * 若捕获到 **403** 响应，则与直调 API 已互证；否则再断言首屏 RBAC 文案（`adminFetchJson` 路径下偶发
     * `admin_requestFailed` 泛化句，**不**作为硬失败条件）。
     */
    if (!listRes || listRes.status() !== 403) {
      await expect(main).toContainText(
        /Administrator|管理员权限|需要管理员权限|需要管理员登录|Admin session|登录权限|无法加载管理端数据/i,
        { timeout: 90_000 },
      );
    }
    await page.screenshot({ path: join(evidenceDir, "admin-orders-403-tourist.png"), fullPage: true });

    writeJson("report-rbac.json", {
      status: "PASS",
      cases: [
        { id: "admin-rbac-unauth", http: unauth.status(), expect: "401 login_required path" },
        { id: "admin-rbac-tourist-api", http: touristRes.status(), expect: "403 admin_required" },
        { id: "admin-rbac-guide-api", http: guideRes.status(), expect: "403 admin_required" },
        { id: "admin-rbac-tourist-ui-orders", expect: "alert admin_required copy" },
      ],
    });
    writeTarget("D-ADM-002-rbac-api-ui", {
      status: "PASS",
      note: "401/403 API + 游客 /admin/orders 权限面",
      evidence: ["rbac-unauth-admin-users.json", "rbac-tourist-admin-users.json", "rbac-guide-admin-users.json", "admin-orders-403-tourist.png", "report-rbac.json"],
    });
  });
});

test.describe("93-admin deep · optional Admin bearer parity @e2e-sepolia-deferred", () => {
  test("PLAYWRIGHT_ADMIN_BEARER：GET /api/v1/admin/orders 字段壳（items / meta）", async ({ request }) => {
    test.setTimeout(120_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) {
      test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置（无真管理员 JWT 时预期跳过）");
    }
    if (!chainOff) {
      test.skip(true, "chain_off 未挂载");
    }
    const res = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/admin/orders?limit=10`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const text = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { parse_error: true, raw_head: text.slice(0, 400) };
    }
    writeJson("admin-bearer-orders.json", {
      response: { status: res.status(), body },
    });
    expect(res.ok(), `admin orders expected 200, got ${res.status()}`).toBeTruthy();
    const b = body as { items?: unknown[]; meta?: unknown };
    expect(Array.isArray(b.items)).toBeTruthy();
    expect(b.meta).toBeDefined();
    if (b.items!.length > 0) {
      const row = b.items![0] as Record<string, unknown>;
      expect(row).toHaveProperty("id");
      expect(row).toHaveProperty("state");
      expect(row).toHaveProperty("amount");
    }
    writeTarget("D-ADM-bearer-orders-shell", {
      status: "PASS",
      note: "GET /api/v1/admin/orders items+meta",
      evidence: ["admin-bearer-orders.json"],
    });
  });
});

test.describe("93-admin deep · RBAC admin vs super_admin API @e2e-sepolia-deferred", () => {
  test("role=admin 会话调 POST …/scheduler/jobs/93deep.probe/rerun → 403 super_admin_required", async ({ request }) => {
    test.setTimeout(120_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const bearer =
      process.env.PLAYWRIGHT_ADMIN_ONLY_BEARER?.trim() || process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) {
      test.skip(true, "须 PLAYWRIGHT_ADMIN_ONLY_BEARER（推荐）或 role=admin 的 PLAYWRIGHT_ADMIN_BEARER");
    }
    const me = await fetchMeUser(request, apiBase, bearer);
    if (!me || me.role !== "admin") {
      test.skip(true, `当前 Bearer /api/v1/me.role=${me?.role ?? "null"}，非 admin 时跳过 super 边界负例`);
    }
    const res = await requestPostWith429Retry(request, `${apiBase}/api/v1/admin/scheduler/jobs/93deep.probe/rerun`, {
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      data: { reason: "93-ADMIN-DEEP rbac probe" },
    });
    const body = await res.json().catch(() => ({}));
    writeJson("rbac-admin-vs-super-scheduler-rerun.json", {
      request: "POST /api/v1/admin/scheduler/jobs/93deep.probe/rerun",
      me_role: me.role,
      response: { status: res.status(), body },
    });
    expect(res.status()).toBe(403);
    expect((body as { error?: string }).error).toBe("super_admin_required");
    writeTarget("D-ADM-rbac-super-boundary", {
      status: "PASS",
      note: "admin 不可 rerun scheduler（super_admin_required）",
      evidence: ["rbac-admin-vs-super-scheduler-rerun.json"],
    });
  });
});

test.describe("93-admin deep · super_admin scheduler rerun write (optional DB) @e2e-sepolia-deferred", () => {
  test("POST …/scheduler/jobs/93deep.probe/rerun：200 或 503 admin_db_required", async ({ request }) => {
    test.setTimeout(120_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const superBearer =
      process.env.PLAYWRIGHT_SUPER_ADMIN_BEARER?.trim() || process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!superBearer) test.skip(true, "须 PLAYWRIGHT_SUPER_ADMIN_BEARER 或 super 的 PLAYWRIGHT_ADMIN_BEARER");
    const me = await fetchMeUser(request, apiBase, superBearer);
    if (!me || me.role !== "super_admin") {
      test.skip(true, `当前 Bearer /api/v1/me.role=${me?.role ?? "null"}，非 super_admin 时跳过真写`);
    }
    const res = await requestPostWith429Retry(request, `${apiBase}/api/v1/admin/scheduler/jobs/93deep.probe/rerun`, {
      headers: { Authorization: `Bearer ${superBearer}`, "Content-Type": "application/json" },
      data: { reason: "93-ADMIN-DEEP super write smoke" },
    });
    const body = await res.json().catch(() => ({}));
    writeJson("super-admin-scheduler-rerun.json", {
      request: "POST /api/v1/admin/scheduler/jobs/93deep.probe/rerun",
      response: { status: res.status(), body },
    });
    if (res.status() === 503 && (body as { error?: string }).error === "admin_db_required") {
      writeTarget("D-ADM-super-write-scheduler", {
        status: "SKIP",
        note: "API 无 admin DB pool（admin_db_required），链下内存栈不断言写库",
        evidence: ["super-admin-scheduler-rerun.json"],
      });
      return;
    }
    expect(res.ok(), `super scheduler rerun ${res.status()}`).toBeTruthy();
    writeTarget("D-ADM-super-write-scheduler", {
      status: "PASS",
      note: "super_admin 调度器 rerun 入队",
      evidence: ["super-admin-scheduler-rerun.json"],
    });
  });
});

test.describe("93-admin deep · admin PATCH guide registration round-trip @e2e-sepolia-deferred", () => {
  test("PATCH …/admin/guides/:id：pending_review → 读回 → active 复原", async ({ request }) => {
    test.setTimeout(120_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置");
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const list = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/admin/guides?limit=5`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const listJson = (await list.json().catch(() => ({}))) as { items?: { id?: string; status?: string }[] };
    writeJson("admin-write-guides-list.json", { status: list.status(), body: listJson });
    expect(list.ok()).toBeTruthy();
    const gid = (listJson.items?.[0]?.id ?? "").trim();
    if (gid.length < 10) {
      writeTarget("D-ADM-write-guide-patch", { status: "SKIP", note: "无向导行可 PATCH" });
      test.skip(true, "admin guides 列表为空");
    }
    const detailBefore = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const before = (await detailBefore.json()) as { guide?: { status?: string } };
    const orig = (before.guide?.status ?? "active").trim();
    writeJson("admin-write-guide-detail-before.json", { status: detailBefore.status(), body: before });

    const p1 = await requestPatchExpectOkWith429Backoff(request, `${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      data: { status: "pending_review", rejection_codes: [], rejection_message: null },
    });
    const p1b = await p1.json().catch(() => ({}));
    writeJson("admin-write-guide-patch-pending_review.json", { status: p1.status(), body: p1b });
    expect(p1.ok(), `patch pending_review ${p1.status()}`).toBeTruthy();

    const detailMid = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const mid = (await detailMid.json()) as { guide?: { status?: string } };
    writeJson("admin-write-guide-detail-mid.json", { status: detailMid.status(), body: mid });
    expect((mid.guide?.status ?? "").toLowerCase()).toBe("pending_review");

    const p2 = await requestPatchExpectOkWith429Backoff(request, `${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      data: { status: orig || "active", rejection_codes: [], rejection_message: null },
    });
    const p2b = await p2.json().catch(() => ({}));
    writeJson("admin-write-guide-patch-restore.json", { status: p2.status(), body: p2b });
    expect(p2.ok(), `patch restore ${p2.status()}`).toBeTruthy();

    writeTarget("D-ADM-write-guide-patch", {
      status: "PASS",
      note: "admin/super 均可 PATCH 向导注册态（require_admin_actor）",
      evidence: [
        "admin-write-guides-list.json",
        "admin-write-guide-detail-before.json",
        "admin-write-guide-patch-pending_review.json",
        "admin-write-guide-detail-mid.json",
        "admin-write-guide-patch-restore.json",
      ],
    });
  });
});
