/**
 * B-463：浏览器端 `GET|POST …/orders/:id/reviews` 与 `reviewJsonContractClient` 消费 / 降级（B-452/B-453）验收。
 * 依赖全栈：`SEED_TEST_ACCOUNTS`、`P3_CHAIN_OFF`（mock-pay），与 Epic F 同源 API 前置链。
 * 双边 UI 闭环（旅行者 /rate 提交 → 向导 /escrow 可见）：`b465-bilateral-review-ui-e2e.spec.ts`。
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";
import { skipUnlessOrderMockPayAvailable } from "./helpers/skipUnlessOrderMockPayAvailable";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

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

async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as { token?: string };
  const t = body.token?.trim();
  expect(t).toBeTruthy();
  return t as string;
}

/** chain_off：下单 → 接单 → mock-pay → confirm-completion → completed（资金终态后可链下评价） */
async function createCompletedOrder(
  request: APIRequestContext
): Promise<{ orderId: string; touristToken: string }> {
  await skipUnlessOrderMockPayAvailable(request, API_BASE);
  await request
    .post(`${API_BASE}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: "{}",
    })
    .catch(() => null);
  await releaseSeedGuideSlotIfBlocked(request, API_BASE);

  const touristToken = await apiLogin(request, "tourist@test.com", "Test123!");
  const guideToken = await apiLogin(request, "guide@test.com", "Test123!");
  const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
  expect(guideId, "guide@test guide.id").toBeTruthy();

  const createRes = await request.post(`${API_BASE}/api/v1/orders`, {
    headers: {
      Authorization: `Bearer ${touristToken}`,
      "Content-Type": "application/json",
    },
    data: {
      guide_id: guideId,
      amount: "130",
      currency: "USD",
    },
  });
  expect(createRes.ok(), await createRes.text()).toBeTruthy();
  const created = (await createRes.json()) as { order?: { id?: string } };
  const orderId = created.order?.id;
  expect(orderId).toBeTruthy();

  const acceptRes = await request.post(
    `${API_BASE}/api/v1/orders/${orderId}/accept`,
    { headers: { Authorization: `Bearer ${guideToken}`, "Content-Type": "application/json" }, data: "{}" }
  );
  expect(acceptRes.ok(), await acceptRes.text()).toBeTruthy();

  const payRes = await request.post(
    `${API_BASE}/api/v1/orders/${orderId}/mock-pay`,
    { headers: { Authorization: `Bearer ${touristToken}`, "Content-Type": "application/json" }, data: "{}" }
  );
  expect(payRes.ok(), await payRes.text()).toBeTruthy();

  const doneRes = await request.post(
    `${API_BASE}/api/v1/orders/${orderId}/confirm-completion`,
    { headers: { Authorization: `Bearer ${guideToken}`, "Content-Type": "application/json" }, data: "{}" }
  );
  expect(doneRes.ok(), await doneRes.text()).toBeTruthy();

  return { orderId: orderId as string, touristToken };
}

/** `console.warn("[analytics]", "review_json_contract_degrade", payload)` —— 取结构化 payload */
async function waitForReviewJsonContractDegrade(
  page: Page,
  expectPayload: { degrade: string; api_path: "get_reviews" | "post_review" }
): Promise<void> {
  await page.waitForEvent("console", {
    predicate: async (msg) => {
      if (msg.type() !== "warning") return false;
      const args = msg.args();
      if (args.length < 3) return false;
      try {
        const tag = await args[0]?.jsonValue();
        const event = await args[1]?.jsonValue();
        const payload = await args[2]?.jsonValue();
        if (tag !== "[analytics]" || event !== "review_json_contract_degrade") return false;
        if (payload == null || typeof payload !== "object") return false;
        const p = payload as Record<string, unknown>;
        return p.degrade === expectPayload.degrade && p.api_path === expectPayload.api_path;
      } catch {
        return false;
      }
    },
    timeout: 30_000,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("B-463 · browser reviews + reviewJsonContractClient", {
  tag: "@e2e-chain-off-mock-pay",
}, () => {
  test("表单提交 → 列表展示 → 成功体 weight_breakdown（post_review 消费）", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const { orderId, touristToken } = await createCompletedOrder(request);

    const returnUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/escrow/${orderId}/rate`), { timeout: 30_000 });

    const reviewsHeading = page.getByRole("heading", {
      name: /Reviews \(P23\)|评价（P23）/i,
    });
    await expect(reviewsHeading).toBeVisible({ timeout: 25_000 });

    await page.getByRole("combobox").first().selectOption("5");
    const comment = `b463-e2e-${Date.now().toString(36)}`;
    await page.getByLabel(/Review comment|评论（选填）/i).fill(comment);
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes(`/api/v1/orders/${orderId}/reviews`) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 30_000 }
      ),
      page.getByRole("button", { name: /Submit review|提交评价/i }).click(),
    ]);

    await expect
      .poll(async () => {
        const lr = await request.get(
          `${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/reviews`,
          { headers: { Authorization: `Bearer ${touristToken}` } }
        );
        if (!lr.ok()) return false;
        const j = (await lr.json()) as { items?: { comment?: string | null }[] };
        return (j.items ?? []).some((it) => String(it.comment ?? "").includes(comment));
      })
      .toBeTruthy();

    await expect(page.getByText(comment, { exact: false })).toBeVisible({
      timeout: 25_000,
    });

    await expect(
      page.getByText(/Weight breakdown|权重分解/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("GET reviews 缺 meta → missing_meta 观测（get_reviews）", async ({ page, request }) => {
    test.setTimeout(180_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const { orderId } = await createCompletedOrder(request);

    await page.route("**/api/v1/orders/*/reviews", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const res = await route.fetch();
      let j: { status?: string; items?: unknown[] };
      try {
        j = (await res.json()) as { status?: string; items?: unknown[] };
      } catch {
        await route.continue();
        return;
      }
      const body = JSON.stringify({
        status: j.status ?? "ok",
        items: Array.isArray(j.items) ? j.items : [],
      });
      await route.fulfill({
        status: res.status(),
        contentType: "application/json",
        body,
      });
    });

    const p = waitForReviewJsonContractDegrade(page, {
      degrade: "missing_meta",
      api_path: "get_reviews",
    });

    const returnUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });

    await p;

    await page.unroute("**/api/v1/orders/*/reviews");
  });

  test("POST review 缺 meta → missing_meta 观测（post_review）", async ({ page, request }) => {
    test.setTimeout(180_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const { orderId } = await createCompletedOrder(request);

    await page.route("**/api/v1/orders/*/reviews", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const res = await route.fetch();
      let j: Record<string, unknown>;
      try {
        j = (await res.json()) as Record<string, unknown>;
      } catch {
        await route.continue();
        return;
      }
      const { review, status } = j;
      const body = JSON.stringify({
        status: status ?? "ok",
        review,
      });
      await route.fulfill({
        status: res.status(),
        contentType: "application/json",
        body,
      });
    });

    const p = waitForReviewJsonContractDegrade(page, {
      degrade: "missing_meta",
      api_path: "post_review",
    });

    const returnUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("combobox").first().selectOption("5");
    await page.getByLabel(/Review comment|评论（选填）/i).fill("post-meta-strip");
    await page.getByRole("button", { name: /Submit review|提交评价/i }).click();

    await p;

    await page.unroute("**/api/v1/orders/*/reviews");
  });

  test("GET reviews 未来 schema_version → unknown_future_schema（get_reviews）", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    const { orderId } = await createCompletedOrder(request);

    await page.route("**/api/v1/orders/*/reviews", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const res = await route.fetch();
      let j: {
        status?: string;
        items?: unknown[];
        meta?: Record<string, unknown>;
      };
      try {
        j = (await res.json()) as typeof j;
      } catch {
        await route.continue();
        return;
      }
      const body = JSON.stringify({
        status: j.status ?? "ok",
        items: Array.isArray(j.items) ? j.items : [],
        meta: {
          ...(j.meta ?? {}),
          review_json_contract: {
            schema_version: 999,
            anchor: "E2E-FUTURE-SCHEMA",
          },
        },
      });
      await route.fulfill({
        status: res.status(),
        contentType: "application/json",
        body,
      });
    });

    const p = waitForReviewJsonContractDegrade(page, {
      degrade: "unknown_future_schema",
      api_path: "get_reviews",
    });

    const returnUrl = `/escrow/${encodeURIComponent(orderId)}/rate`;
    await gotoLoginWhenReady(
      page,
      `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });

    await p;

    await page.unroute("**/api/v1/orders/*/reviews");
  });
});
