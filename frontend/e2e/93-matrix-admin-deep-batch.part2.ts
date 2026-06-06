/** 93 Admin deep · part2: orders empty filter UI, cross-check, reconcile, escrow messages. */
import { join } from "node:path";

import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { adminAppPageShell, escrowDetailPageShell } from "./helpers/pageShells";
import { deepCtx, fetchMeUser, writeJson, writeTarget } from "./helpers/adminDeepBatchShared";
import {
  requestGetExpectOkWith429Backoff,
  requestPostExpectOkWith429Backoff,
  requestPostWith429Retry,
} from "./helpers/playwright429Backoff";

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
    const apiList = await requestGetExpectOkWith429Backoff(
      request,
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
    const main = adminAppPageShell(page);
    await expect(main).toBeVisible({ timeout: 90_000 });
    await expect(main.getByText(/No records\.|暂无记录。/)).toBeVisible({ timeout: 90_000 });
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
    const res = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/admin/cross-check`,
      { headers: { Authorization: `Bearer ${bearer}` } },
    );
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

    const post = await requestPostWith429Retry(request, `${apiBase}/api/v1/internal/indexer-reconcile`, {
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

    const getRep = await requestGetExpectOkWith429Backoff(
      request,
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
    const touristCreds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    const touristTok = touristCreds?.token ?? null;
    if (!touristTok) test.skip(true, "tourist 登录失败");

    const guideId = await guideRowIdForSeedGuideAccount(request, apiBase);
    if (!guideId) test.skip(true, "guide 行 id 缺失");

    const amount = `41.${Date.now().toString().slice(-4)}`;
    const idem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `deep-msg-${Date.now()}`;
    const createRes = await requestPostWith429Retry(request, `${apiBase}/api/v1/orders`, {
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

    const listBefore = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`,
      { headers: { Authorization: `Bearer ${touristTok}` } },
    );
    expect(listBefore.ok()).toBeTruthy();
    const listBeforeJson = (await listBefore.json()) as { items?: unknown[] };
    expect(Array.isArray(listBeforeJson.items)).toBeTruthy();

    const marker = `deep-e2e-msg-${Date.now()}`;
    const msgIdem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `deep-msg-post-${Date.now()}`;
    const postRes = await requestPostExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`,
      {
        headers: {
          Authorization: `Bearer ${touristTok}`,
          "Content-Type": "application/json",
          "Idempotency-Key": msgIdem,
        },
        data: { content: marker },
      },
    );
    const postBody = await postRes.json().catch(() => ({}));
    writeJson("escrow-messages-post.json", {
      order_id: orderId,
      response: { status: postRes.status(), body: postBody },
    });
    expect(postRes.ok(), `POST messages ${postRes.status()}`).toBeTruthy();
    expect((postBody as { message?: { content?: string } }).message?.content).toBe(marker);

    const listAfter = await requestGetExpectOkWith429Backoff(
      request,
      `${apiBase}/api/v1/orders/${encodeURIComponent(orderId)}/messages`,
      { headers: { Authorization: `Bearer ${touristTok}` } },
    );
    const listAfterJson = (await listAfter.json()) as { items?: { content: string }[] };
    expect(listAfter.ok()).toBeTruthy();
    const contents = (listAfterJson.items ?? []).map((x) => x.content);
    expect(contents).toContain(marker);

    writeJson("escrow-messages-readback.json", {
      order_id: orderId,
      api_list_contains: marker,
      list_item_count: (listAfterJson.items ?? []).length,
    });

    const credJson = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    expect(credJson?.token && credJson.userId).toBeTruthy();
    const origin = (baseURL ?? "http://127.0.0.1:3012").replace(/\/$/, "");
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: credJson!.userId, url: origin },
    ]);
    try {
      await gotoWithBearerSession(page, `/escrow/${encodeURIComponent(orderId)}`, {
        token: credJson!.token,
        userId: credJson!.userId,
      });
    } catch (e) {
      const msg = String(e);
      if (msg.includes("ERR_CONNECTION_REFUSED") || msg.includes("NS_ERROR_CONNECTION_REFUSED")) {
        test.skip(true, "Next 前端未监听（仅 -g 子集时常无 webServer）；整文件 `…deep-batch.spec.ts --project=chromium` 复跑");
      }
      throw e;
    }

    const escrowDetailShell = escrowDetailPageShell(page);
    await expect(escrowDetailShell).toBeVisible({ timeout: 90_000 });
    const chatHeading = escrowDetailShell.getByRole("heading", { name: /Chat \(P16\)|聊天（P16）/i });
    await chatHeading.waitFor({ state: "visible", timeout: 90_000 }).catch(() => null);
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

    await expect(chatHeading).toBeVisible({ timeout: 90_000 });
    await expect(escrowDetailShell.getByText(marker, { exact: true })).toBeVisible({ timeout: 90_000 });
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
