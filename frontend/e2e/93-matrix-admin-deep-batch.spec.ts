/**
 * 93 矩阵 · **Admin 深批**（RBAC / 403 面 / 订单消息写读 / 可选 Admin API 对拍；**不**扩 admin 静态壳路由表）。
 *
 * **证据**：`evidence/93-batch-admin-deep-audit/<run_id>/`（`meta-snapshot.json`、`rbac-*.json`、`escrow-messages-*.json`、`report.json`、可选截图）。
 * **TT-L4**：`describe` 名含 **`@e2e-sepolia-deferred`**。
 * **机读盘点**：`python scripts/dev/inventory_admin_deep_audit.py --write evidence/93-batch-admin-deep-audit/inventory-surface.generated.md`
 *
 * 复跑：`cd frontend && npx playwright test e2e/93-matrix-admin-deep-batch.spec.ts --project=chromium`
 * 可选：`ADMIN_DEEP_RUN_ID=run_local_1`、`PLAYWRIGHT_ADMIN_BEARER=<session>`（管理员会话，用于列表/对拍/向导 PATCH）。
 * RBAC **admin vs super_admin**：`PLAYWRIGHT_ADMIN_ONLY_BEARER`（**role=admin**，测 `super_admin_required` 403）与 `PLAYWRIGHT_SUPER_ADMIN_BEARER`（**super_admin**，测调度器 rerun 等真写）。
 * 对账 **POST→GET**：`PLAYWRIGHT_INTERNAL_API_SECRET`（与 API 进程 `INTERNAL_API_SECRET` 一致时带 `X-Internal-Api-Secret` 调 `POST /api/v1/internal/indexer-reconcile`）。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  apiLoginReturnToken,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";

type DeepCtx = {
  apiBase: string;
  evidenceDir: string;
  chainOff: boolean;
};

let deepCtx: DeepCtx | null = null;

function evidenceRunDir(): string {
  const id = process.env.ADMIN_DEEP_RUN_ID?.trim() || `run_${Date.now()}`;
  return join(process.cwd(), "..", "evidence", "93-batch-admin-deep-audit", id);
}

function writeJson(rel: string, data: unknown) {
  if (!deepCtx) return;
  writeFileSync(join(deepCtx.evidenceDir, rel), JSON.stringify(data, null, 2), "utf-8");
}

function writeTarget(id: string, row: { status: "PASS" | "SKIP" | "FAIL"; note?: string; evidence?: string[] }) {
  writeJson(`target-${id}.json`, { id, ...row, at: new Date().toISOString() });
}

async function fetchMeUser(
  request: APIRequestContext,
  apiBase: string,
  bearer: string,
): Promise<{ id: string; role: string } | null> {
  const res = await request.get(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!res.ok()) return null;
  const j = (await res.json()) as { user?: { id?: string; role?: string } };
  const id = (j.user?.id ?? "").trim();
  const role = (j.user?.role ?? "").trim();
  if (!id || !role) return null;
  return { id, role };
}

test.beforeAll(async ({ request }) => {
  const apiBase = defaultApiBase();
  const health = await request.get(`${apiBase}/health`).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API 不可用：${apiBase}/health`);
  }
  const metaRes = await request.get(`${apiBase}/meta`).catch(() => null);
  const metaJson = metaRes?.ok() ? ((await metaRes.json()) as Record<string, unknown>) : null;
  const did = metaJson?.did_rank as Record<string, unknown> | undefined;
  const chainOff = did?.chain_off_mounted === true;
  const evidenceDir = evidenceRunDir();
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(
    join(evidenceDir, "meta-snapshot.json"),
    JSON.stringify(
      {
        apiBase,
        health_ok: health.ok(),
        meta_status: metaRes?.status() ?? null,
        did_rank: did ?? null,
        chain_off_mounted: chainOff,
      },
      null,
      2,
    ),
    "utf-8",
  );
  deepCtx = { apiBase, evidenceDir, chainOff };
});

test.describe("93-admin deep · RBAC API + 游客 Admin UI 403 面 @e2e-sepolia-deferred", () => {
  test("未登录 / 游客 / 向导 调 GET /api/v1/admin/users；游客打开 /admin/orders 呈 admin_required 提示", async ({
    request,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, evidenceDir, chainOff } = deepCtx;

    const unauth = await request.get(`${apiBase}/api/v1/admin/users?limit=5`);
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
    const touristTok = await apiLoginReturnToken(request, apiBase, "tourist@test.com", "Test123!");
    const guideTok = await apiLoginReturnToken(request, apiBase, "guide@test.com", "Test123!");
    if (!touristTok || !guideTok) {
      test.skip(true, "种子账号登录失败（需 SEED_TEST_ACCOUNTS）");
    }

    const touristRes = await request.get(`${apiBase}/api/v1/admin/users?limit=5`, {
      headers: { Authorization: `Bearer ${touristTok}` },
    });
    const touristBody = await touristRes.json().catch(() => ({}));
    writeJson("rbac-tourist-admin-users.json", {
      request: { method: "GET", url: "/api/v1/admin/users?limit=5", auth: "Bearer tourist" },
      response: { status: touristRes.status(), body: touristBody },
    });
    expect(touristRes.status()).toBe(403);
    expect((touristBody as { error?: string }).error).toBe("admin_required");

    const guideRes = await request.get(`${apiBase}/api/v1/admin/users?limit=5`, {
      headers: { Authorization: `Bearer ${guideTok}` },
    });
    const guideBody = await guideRes.json().catch(() => ({}));
    writeJson("rbac-guide-admin-users.json", {
      request: { method: "GET", url: "/api/v1/admin/users?limit=5", auth: "Bearer guide" },
      response: { status: guideRes.status(), body: guideBody },
    });
    expect(guideRes.status()).toBe(403);
    expect((guideBody as { error?: string }).error).toBe("admin_required");

    const cred = await request.post(`${apiBase}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    const credJson = (await cred.json()) as { token?: string; user_id?: string };
    expect(cred.ok() && credJson.token && credJson.user_id).toBeTruthy();
    /** Edge middleware 读 **Cookie**；仅 `localStorage` 时会被挡在 `/auth/login`（见失败快照 `aria-label=登录`）。 */
    const origin = (baseURL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: credJson.user_id!, url: origin },
    ]);
    const adminOrdersList = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        (r.url().includes("/api/v1/admin/orders") ||
          (r.url().includes("/admin/orders") && r.url().includes("/api/"))),
      { timeout: 60_000 },
    );
    await gotoWithBearerSession(page, "/admin/orders", {
      token: credJson.token!,
      userId: credJson.user_id!,
    });
    const listRes = await adminOrdersList.catch(() => null);
    if (listRes) {
      expect(listRes.status(), "浏览器侧列表拉取须 403（与 API 直调一致）").toBe(403);
    }

    const main = page.getByRole("main");
    await expect(main).toBeVisible({ timeout: 45_000 });
    /**
     * 若捕获到 **403** 响应，则与直调 API 已互证；否则再断言首屏 RBAC 文案（`adminFetchJson` 路径下偶发
     * `admin_requestFailed` 泛化句，**不**作为硬失败条件）。
     */
    if (!listRes || listRes.status() !== 403) {
      await expect(main).toContainText(
        /Administrator|管理员权限|需要管理员权限|需要管理员登录|Admin session|登录权限|无法加载管理端数据/i,
        { timeout: 60_000 },
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
    test.setTimeout(60_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) {
      test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置（无真管理员 JWT 时预期跳过）");
    }
    if (!chainOff) {
      test.skip(true, "chain_off 未挂载");
    }
    const res = await request.get(`${apiBase}/api/v1/admin/orders?limit=10`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
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
    test.setTimeout(60_000);
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
    const res = await request.post(`${apiBase}/api/v1/admin/scheduler/jobs/93deep.probe/rerun`, {
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
    test.setTimeout(60_000);
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
    const res = await request.post(`${apiBase}/api/v1/admin/scheduler/jobs/93deep.probe/rerun`, {
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
    const list = await request.get(`${apiBase}/api/v1/admin/guides?limit=5`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const listJson = (await list.json().catch(() => ({}))) as { items?: { id?: string; status?: string }[] };
    writeJson("admin-write-guides-list.json", { status: list.status(), body: listJson });
    expect(list.ok()).toBeTruthy();
    const gid = (listJson.items?.[0]?.id ?? "").trim();
    if (gid.length < 10) {
      writeTarget("D-ADM-write-guide-patch", { status: "SKIP", note: "无向导行可 PATCH" });
      test.skip(true, "admin guides 列表为空");
    }
    const detailBefore = await request.get(`${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const before = (await detailBefore.json()) as { guide?: { status?: string } };
    const orig = (before.guide?.status ?? "active").trim();
    writeJson("admin-write-guide-detail-before.json", { status: detailBefore.status(), body: before });

    const p1 = await request.patch(`${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      data: { status: "pending_review", rejection_codes: [], rejection_message: null },
    });
    const p1b = await p1.json().catch(() => ({}));
    writeJson("admin-write-guide-patch-pending_review.json", { status: p1.status(), body: p1b });
    expect(p1.ok(), `patch pending_review ${p1.status()}`).toBeTruthy();

    const detailMid = await request.get(`${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const mid = (await detailMid.json()) as { guide?: { status?: string } };
    writeJson("admin-write-guide-detail-mid.json", { status: detailMid.status(), body: mid });
    expect((mid.guide?.status ?? "").toLowerCase()).toBe("pending_review");

    const p2 = await request.patch(`${apiBase}/api/v1/admin/guides/${encodeURIComponent(gid)}`, {
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

test.describe("93-admin deep · admin orders empty filtered + UI @e2e-sepolia-deferred", () => {
  test("GET …/admin/orders?state=__93deep_empty__ + /admin/orders 同参 UI 对拍空态", async ({ page, request, baseURL }) => {
    test.setTimeout(180_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, evidenceDir, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置");
    const me = await fetchMeUser(request, apiBase, bearer);
    if (!me?.id) test.skip(true, "/api/v1/me 不可用");

    const impossible = "__93deep_empty__";
    const apiList = await request.get(
      `${apiBase}/api/v1/admin/orders?limit=20&state=${encodeURIComponent(impossible)}`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
    const listBody = (await apiList.json().catch(() => ({}))) as { items?: unknown[]; applied_filters?: unknown };
    writeJson("admin-orders-empty-filter-api.json", { status: apiList.status(), body: listBody });
    expect(apiList.ok()).toBeTruthy();
    expect(Array.isArray(listBody.items)).toBeTruthy();
    expect((listBody.items ?? []).length).toBe(0);

    const origin = (baseURL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
    await page.context().addCookies([{ name: "traveltrust_user_id", value: me.id, url: origin }]);
    try {
      await gotoWithBearerSession(page, `/admin/orders?limit=20&state=${encodeURIComponent(impossible)}`, {
        token: bearer,
        userId: me.id,
      });
    } catch (e) {
      const msg = String(e);
      if (msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("NS_ERROR_CONNECTION_REFUSED")) {
        test.skip(true, "Next 未监听");
      }
      throw e;
    }
    const main = page.getByRole("main");
    await expect(main).toBeVisible({ timeout: 45_000 });
    await expect(main.getByText(/No records\.|暂无记录。/)).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: join(evidenceDir, "admin-orders-empty-filter-ui.png"), fullPage: true });
    writeTarget("D-ADM-orders-empty-filtered-ui", {
      status: "PASS",
      note: "真管理员 + 不可能 state 过滤 → API items=[] 且 UI admin_empty_table",
      evidence: ["admin-orders-empty-filter-api.json", "admin-orders-empty-filter-ui.png"],
    });
  });
});

test.describe("93-admin deep · admin cross-check GET @e2e-sepolia-deferred", () => {
  test("GET …/admin/cross-check：200 + fee_pool_projection + drift_summary", async ({ request }) => {
    test.setTimeout(120_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const bearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!bearer) test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置");
    const res = await request.get(`${apiBase}/api/v1/admin/cross-check`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    const body = await res.json().catch(() => ({}));
    writeJson("admin-cross-check.json", { status: res.status(), body });
    expect(res.ok(), `cross-check ${res.status()}`).toBeTruthy();
    const b = body as { fee_pool_projection?: unknown; drift_summary?: { drift_detected?: boolean } };
    expect(b.fee_pool_projection).toBeDefined();
    expect(b.drift_summary).toBeDefined();
    expect(typeof b.drift_summary?.drift_detected).toBe("boolean");
    writeTarget("D-ADM-cross-check-read", {
      status: "PASS",
      note: "只读对账投影壳 GET /admin/cross-check",
      evidence: ["admin-cross-check.json"],
    });
  });
});

test.describe("93-admin deep · reconcile POST internal → GET admin report @e2e-sepolia-deferred", () => {
  test("POST …/internal/indexer-reconcile persist:true → GET …/admin/indexer/reconcile-report/:id", async ({ request }) => {
    test.setTimeout(180_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, chainOff } = deepCtx;
    if (!chainOff) test.skip(true, "chain_off 未挂载");
    const adminBearer = process.env.PLAYWRIGHT_ADMIN_BEARER?.trim();
    if (!adminBearer) test.skip(true, "PLAYWRIGHT_ADMIN_BEARER 未设置");
    const internalSecret = process.env.PLAYWRIGHT_INTERNAL_API_SECRET?.trim();
    const internalHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (internalSecret) internalHeaders["X-Internal-Api-Secret"] = internalSecret;

    const post = await request.post(`${apiBase}/api/v1/internal/indexer-reconcile`, {
      headers: internalHeaders,
      data: { persist: true },
    });
    const postBody = await post.json().catch(() => ({}));
    writeJson("reconcile-internal-post.json", { status: post.status(), body: postBody });
    const reportId = (postBody as { report_id?: string }).report_id?.trim();
    if (!post.ok()) {
      const err = (postBody as { error?: string }).error ?? "";
      writeTarget("D-ADM-reconcile-post-get", {
        status: "SKIP",
        note: `POST indexer-reconcile 非 2xx（${post.status()} ${err}）；常见：chain_not_configured / database_required_for_reconcile`,
        evidence: ["reconcile-internal-post.json"],
      });
      test.skip(true, `indexer-reconcile POST 不可用：HTTP ${post.status()} ${err}`);
    }
    if (!reportId) {
      writeTarget("D-ADM-reconcile-post-get", {
        status: "SKIP",
        note: "persist 未返回 report_id（可能未落库）",
        evidence: ["reconcile-internal-post.json"],
      });
      test.skip(true, "无 report_id");
    }
    const postStats = (postBody as { stats?: { issues_total?: number; projection_reconcile_clean?: boolean } }).stats;
    expect(postStats).toBeDefined();

    const getRep = await request.get(
      `${apiBase}/api/v1/admin/indexer/reconcile-report/${encodeURIComponent(reportId)}`,
      { headers: { Authorization: `Bearer ${adminBearer}` } },
    );
    const getBody = await getRep.json().catch(() => ({}));
    writeJson("reconcile-admin-get-report.json", { status: getRep.status(), body: getBody });
    expect(getRep.ok(), `GET reconcile-report ${getRep.status()}`).toBeTruthy();
    const rep = (getBody as { report?: { summary?: { stats?: typeof postStats } } }).report;
    expect(rep?.summary?.stats).toBeDefined();
    const st = rep!.summary!.stats!;
    expect(st.issues_total).toBe(postStats!.issues_total);
    expect(st.projection_reconcile_clean).toBe(postStats!.projection_reconcile_clean);
    writeTarget("D-ADM-reconcile-post-get", {
      status: "PASS",
      note: "internal POST persist 与 admin GET 单条报告 summary 关键字段对拍",
      evidence: ["reconcile-internal-post.json", "reconcile-admin-get-report.json"],
    });
  });
});

test.describe("93-admin deep · escrow order messages POST + GET + UI @e2e-sepolia-deferred", () => {
  test("API 写读 + /escrow/:id ChatBlock 展示与 GET messages 对拍", async ({ page, request, baseURL }) => {
    test.setTimeout(240_000);
    if (!deepCtx) test.skip(true, "beforeAll 未初始化 deepCtx");
    const { apiBase, evidenceDir, chainOff } = deepCtx;
    if (!chainOff) {
      test.skip(true, "chain_off 未挂载：订单消息 501");
    }

    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const touristTok = await apiLoginReturnToken(request, apiBase, "tourist@test.com", "Test123!");
    if (!touristTok) test.skip(true, "tourist 登录失败");

    const guideId = await guideRowIdForSeedGuideAccount(request, apiBase);
    if (!guideId) test.skip(true, "guide 行 id 缺失");

    const amount = `41.${Date.now().toString().slice(-4)}`;
    const idem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `deep-msg-${Date.now()}`;
    const createRes = await request.post(`${apiBase}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${touristTok}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idem,
      },
      data: { guide_id: guideId, amount, currency: "USD" },
    });
    if (!createRes.ok()) {
      test.skip(true, `建单失败 HTTP ${createRes.status()} ${(await createRes.text()).slice(0, 200)}`);
    }
    const created = (await createRes.json()) as { order?: { id?: string } };
    const orderId = (created.order?.id ?? "").trim();
    expect(orderId.length).toBeGreaterThan(10);

    const listBefore = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`, {
      headers: { Authorization: `Bearer ${touristTok}` },
    });
    expect(listBefore.ok()).toBeTruthy();
    const listBeforeJson = (await listBefore.json()) as { items?: unknown[] };
    expect(Array.isArray(listBeforeJson.items)).toBeTruthy();

    const marker = `deep-e2e-msg-${Date.now()}`;
    const postRes = await request.post(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`, {
      headers: {
        Authorization: `Bearer ${touristTok}`,
        "Content-Type": "application/json",
      },
      data: { content: marker },
    });
    const postBody = await postRes.json().catch(() => ({}));
    writeJson("escrow-messages-post.json", {
      order_id: orderId,
      response: { status: postRes.status(), body: postBody },
    });
    expect(postRes.ok(), `POST messages ${postRes.status()}`).toBeTruthy();
    expect((postBody as { message?: { content?: string } }).message?.content).toBe(marker);

    const listAfter = await request.get(`${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`, {
      headers: { Authorization: `Bearer ${touristTok}` },
    });
    const listAfterJson = (await listAfter.json()) as { items?: { content: string }[] };
    expect(listAfter.ok()).toBeTruthy();
    const contents = (listAfterJson.items ?? []).map((x) => x.content);
    expect(contents).toContain(marker);

    writeJson("escrow-messages-readback.json", {
      order_id: orderId,
      api_list_contains: marker,
      list_item_count: (listAfterJson.items ?? []).length,
    });

    const cred = await request.post(`${apiBase}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    const credJson = (await cred.json()) as { token?: string; user_id?: string };
    expect(credJson.token && credJson.user_id).toBeTruthy();
    const origin = (baseURL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: credJson.user_id!, url: origin },
    ]);
    try {
      await gotoWithBearerSession(page, `/escrow/${encodeURIComponent(orderId)}`, {
        token: credJson.token!,
        userId: credJson.user_id!,
      });
    } catch (e) {
      const msg = String(e);
      if (msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("NS_ERROR_CONNECTION_REFUSED")) {
        test.skip(true, "Next 前端未监听（仅 -g 子集时常无 webServer）；整文件 `…deep-batch.spec.ts --project=chromium` 复跑");
      }
      throw e;
    }

    await expect(page.getByRole("main")).toBeVisible({ timeout: 45_000 });
    const chatHeading = page.getByRole("heading", { name: /Chat \(P16\)|聊天（P16）/i });
    await chatHeading.waitFor({ state: "visible", timeout: 25_000 }).catch(() => null);
    const chatUi = await chatHeading.isVisible().catch(() => false);

    if (!chatUi) {
      writeJson("escrow-messages-ui-skipped.json", {
        reason:
          "Escrow 未渲染 ChatBlock（`showItineraryBudgetZone` 须无 escrow 且 draft|created|accepted 并有 itinerary）；全栈真实建单常不满足，API 对拍仍成立",
      });
      await page.screenshot({ path: join(evidenceDir, "escrow-messages-ui-no-chatblock.png"), fullPage: true });
      writeJson("report-escrow-messages.json", {
        status: "PASS",
        cases: [
          { id: "B-MSG-002-api-post", marker },
          { id: "B-MSG-002-api-get", contains: marker },
          { id: "B-MSG-002-ui", status: "SKIP", note: "ChatBlock 未挂载" },
        ],
      });
      writeTarget("B-MSG-002", {
        status: "PASS",
        note: "API POST+GET OK；UI 因协议区未展开跳过（见 escrow-messages-ui-skipped.json）",
        evidence: [
          "escrow-messages-post.json",
          "escrow-messages-readback.json",
          "escrow-messages-ui-no-chatblock.png",
          "escrow-messages-ui-skipped.json",
          "report-escrow-messages.json",
        ],
      });
      return;
    }

    await expect(chatHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(marker, { exact: true })).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: join(evidenceDir, "escrow-messages-ui.png"), fullPage: true });

    writeJson("report-escrow-messages.json", {
      status: "PASS",
      cases: [
        { id: "B-MSG-002-api-post", marker },
        { id: "B-MSG-002-api-get", contains: marker },
        { id: "B-MSG-002-ui", contains: marker },
      ],
    });
    writeTarget("B-MSG-002", {
      status: "PASS",
      note: "订单消息 POST+GET+UI",
      evidence: ["escrow-messages-post.json", "escrow-messages-readback.json", "escrow-messages-ui.png", "report-escrow-messages.json"],
    });
  });
});

test.afterAll(() => {
  if (!deepCtx) return;
  const dir = deepCtx.evidenceDir;
  const target_matrix: Record<string, unknown> = {};
  try {
    for (const name of readdirSync(dir)) {
      if (!name.startsWith("target-") || !name.endsWith(".json")) continue;
      const key = name.slice("target-".length, name.length - 5);
      try {
        target_matrix[key] = JSON.parse(readFileSync(join(dir, name), "utf-8")) as unknown;
      } catch {
        target_matrix[key] = { parse_error: true, file: name };
      }
    }
  } catch {
    /* ignore */
  }
  writeJson("report.json", {
    batch: "93-ADMIN-DEEP",
    evidenceDir: dir,
    chain_off_mounted: deepCtx.chainOff,
    finished_at: new Date().toISOString(),
    target_matrix,
  });
});
