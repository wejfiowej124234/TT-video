/**
 * 96-18 · G15：**`/me/onboarding`** 匿名报价 + 登录后资格 JSON；登录区含 **真实** **`payment-intents` / `role-confirm`** 按钮（**`data-testid`**）。
 * 须 **API（`chain_off` 已挂载）+ Next**；报价 **`meta.implementation_status`** 为 **`onboarding_quote_stub`** 或 **`onboarding_quote_with_charge_amount`**（Stripe 开关开）时通过首条用例。资格 **`meta.implementation_status`** 在 **PG 已接线** 时可能为 **`onboarding_entitlements_db`**（与 **stub** 等价通过本 spec）。
 * **第四条（路由 mock）**：在 **entitlements stub/db** 与 **登录** 可用时，对浏览器 **`POST …/payment-intents`** **首包 409** **`onboarding_idempotency_conflict`**、**重试包 200** 模拟，断言 **`me-onboarding-retry-payment-intent`** **立即可点**（**无** **429** **倒计时** **disabled**）与成功 JSON（**不**依赖真实 PG 落 **payment-intents**）。
 * **第五条（路由 mock）**：同上路径 **首包 429** **`onboarding_user_write_rate_limited`**、**`Retry-After: 2`**、**重试包 200**（与 **第四条** 互证 **uid 写桶 429** 机读 + 重试条；**倒计时 >0 时** **`me-onboarding-retry-payment-intent`** **disabled**，与 **`page.tsx`** **一致**；**不**依赖真实限流计数器）。
 * **第六条（路由 mock）**：**`POST …/role-confirm`** **首包 429**、**`Retry-After: 1`**、**重试包 200**，断言 **`me-onboarding-retry-role-confirm`** **先** **disabled** **再** **enabled**，与 **`onboarding_role_confirm_db`**（**不**走真实 **DB** 写 **`users.role`**）。筛跑：**`-g "role-confirm 429"`**（与 **第五条** **`-g "429 user write"`** 区分）。
 * **第七～八条（路由 mock）**：**`POST …/payment-intents`** 与 **`POST …/role-confirm`** **503** **`onboarding_compliance_screening_unavailable`**（**恒** **503**）；**`goto`** **后** **先** **等** **H1** **+** **`main`** **含** **`onboarding_entitlements_(stub|db)`**（与 **第二条** **同源**，避免 **`-g "503 compliance"`** **单筛** **时** **冷** **栈** **未** **hydrate** **就** **点** **写** **按钮**）；断言 **`<main>`** 含 **`locales`** 人机读（**中英** **子串** **二选一**），**且** **不出现** **`me-onboarding-retry-payment-intent` / `me-onboarding-retry-role-confirm`**（**与** **409/429** **重试条** **正交**）。筛跑：**`-g "503 compliance"`**。
 * **可选第三条**：根 **`.env`** 含 **`INTERNAL_API_SECRET`** 时 Playwright 会同步 **`PLAYWRIGHT_INTERNAL_API_SECRET`**，可测 **intent → 内网 webhook → paid**（**不**跑 shell、**不**触真实主网链）。**不**经过 **`Stripe-Signature`**；**验签 → `paid`** 另见 **API·IT** **`matrix_93_d_onb_005_f036_ext_*`**（**`cargo test -p traveltrust-api matrix_93_d_onb_005_f036_ext`**，**合成** **`whsec_`**）；**Stripe 真网投递 / Dashboard** 手工程序见 **[TT-9618 §3.2](../../docs/runbook/TT-9618-onboarding-local-testnet.md)**。Webhook 请求带 **`X-Forwarded-For`** / **`X-Forwarded-Proto`**（与 **`scripts/dev/onboarding-webhook-local.sh`** 一致），以便 API 启用 **`ONBOARDING_INTERNAL_WEBHOOK_*`** 边缘闸时仍过。若 API 启用 **`ONBOARDING_WEBHOOK_HMAC_SECRET`** 而未为 E2E 配平 secret，第三条 **skip**。若 allowlist **不含** 本请求使用的 **XFF** IP，第三条 **skip**。
 * 与 **`npm run e2e`** 同源 **`chromium`** project（`playwright.config.ts` **webServer**）。
 *
 * 本地：`PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/me-onboarding-96-18-shell.spec.ts --project=chromium`
 */
import { createHmac } from "node:crypto";
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";

test.describe("96-18 · /me/onboarding shell (quote + entitlements stub)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("anonymous: quote JSON exposes onboarding_quote_stub", async ({ page, request }) => {
    const apiBase = defaultApiBase();
    const probe = await request.get(`${apiBase}/api/v1/onboarding/quote?role=provider`).catch(() => null);
    test.skip(!probe?.ok(), `onboarding quote unreachable (${apiBase})`);
    const pj = (await probe.json()) as { meta?: { implementation_status?: string } };
    const qst = pj?.meta?.implementation_status;
    test.skip(
      qst !== "onboarding_quote_stub" && qst !== "onboarding_quote_with_charge_amount",
      "API quote not in stub or stripe-amount mode (chain_off off or different build)",
    );

    await page.goto("/me/onboarding?role=provider&from=identities_hub");
    await expect(page.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByText(/stub|占位|placeholder|webhook|Do not treat|工程占位/i).first()).toBeVisible();
    await expect(page.getByRole("main")).toContainText(/onboarding_quote_(stub|with_charge_amount)/, {
      timeout: 90_000,
    });
  });

  test("logged-in: entitlements JSON exposes onboarding_entitlements_stub_or_db", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" &&
        entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    await gotoWithBearerSession(page, "/me/onboarding", creds);
    await expect(page.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByRole("main")).toContainText(/onboarding_entitlements_(stub|db)/, {
      timeout: 90_000,
    });
    await expect(page.getByTestId("me-onboarding-create-intent")).toBeVisible();
    await expect(page.getByTestId("me-onboarding-role-confirm")).toBeVisible();
  });

  test("logged-in: 409 idempotency conflict then retry — route mock (no PG payment-intents)", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    const mockEntitlementId = "00000000-0000-0000-0000-00000000e2e1";
    let postCount = 0;
    await page.route("**/api/v1/onboarding/payment-intents", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      postCount += 1;
      if (postCount === 1) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            error: "onboarding_idempotency_conflict",
            message: "onboarding_idempotency_conflict",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          entitlement_id: mockEntitlementId,
          idempotency_key: "e2e-route-mock",
          return_url: null,
          psp: { client_secret: null, checkout_url: null },
          meta: {
            implementation_status: "onboarding_payment_intent_persisted_fee_schedule_v1",
            detail: "playwright route mock",
            doc: "e2e/me-onboarding-96-18-shell.spec.ts",
          },
        }),
      });
    });

    try {
      await gotoWithBearerSession(page, "/me/onboarding", creds);
      await expect(page.getByTestId("me-onboarding-create-intent")).toBeVisible({ timeout: 90_000 });

      await page.getByTestId("me-onboarding-create-intent").click();
      const retry409 = page.getByTestId("me-onboarding-retry-payment-intent");
      await expect(retry409).toBeVisible({ timeout: 30_000 });
      await expect(retry409).toBeEnabled();
      await retry409.click();
      await expect(page.getByTestId("me-onboarding-retry-payment-intent")).toHaveCount(0);
      await expect(page.getByRole("main")).toContainText(mockEntitlementId, { timeout: 30_000 });
    } finally {
      await page.unroute("**/api/v1/onboarding/payment-intents");
    }
  });

  test("logged-in: 429 user write rate limited then retry — route mock (payment-intents)", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    const mockEntitlementId = "00000000-0000-0000-0000-00000000e429";
    let postCount = 0;
    await page.route("**/api/v1/onboarding/payment-intents", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      postCount += 1;
      if (postCount === 1) {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "Retry-After": "2" },
          body: JSON.stringify({
            error: "onboarding_user_write_rate_limited",
            message: "onboarding_user_write_rate_limited",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          entitlement_id: mockEntitlementId,
          idempotency_key: "e2e-route-mock-429",
          return_url: null,
          psp: { client_secret: null, checkout_url: null },
          meta: {
            implementation_status: "onboarding_payment_intent_persisted_fee_schedule_v1",
            detail: "playwright route mock 429→retry",
            doc: "e2e/me-onboarding-96-18-shell.spec.ts",
          },
        }),
      });
    });

    try {
      await gotoWithBearerSession(page, "/me/onboarding", creds);
      await expect(page.getByTestId("me-onboarding-create-intent")).toBeVisible({ timeout: 90_000 });

      await page.getByTestId("me-onboarding-create-intent").click();
      const retryPi = page.getByTestId("me-onboarding-retry-payment-intent");
      await expect(retryPi).toBeVisible({ timeout: 30_000 });
      await expect(retryPi).toBeDisabled();
      await expect(retryPi).toBeEnabled({ timeout: 5_000 });
      await retryPi.click();
      await expect(page.getByTestId("me-onboarding-retry-payment-intent")).toHaveCount(0);
      await expect(page.getByRole("main")).toContainText(mockEntitlementId, { timeout: 30_000 });
    } finally {
      await page.unroute("**/api/v1/onboarding/payment-intents");
    }
  });

  test("logged-in: role-confirm 429 write rate limited then retry — route mock", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    let rolePostCount = 0;
    await page.route("**/api/v1/onboarding/role-confirm", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      rolePostCount += 1;
      if (rolePostCount === 1) {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "Retry-After": "1" },
          body: JSON.stringify({
            error: "onboarding_user_write_rate_limited",
            message: "onboarding_user_write_rate_limited",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          role: "provider",
          updated: true,
          meta: { implementation_status: "onboarding_role_confirm_db" },
        }),
      });
    });

    try {
      await gotoWithBearerSession(page, "/me/onboarding", creds);
      await expect(page.getByTestId("me-onboarding-role-confirm")).toBeVisible({ timeout: 90_000 });

      await page.getByTestId("me-onboarding-role-confirm").click();
      const retryRole = page.getByTestId("me-onboarding-retry-role-confirm");
      await expect(retryRole).toBeVisible({ timeout: 30_000 });
      await expect(retryRole).toBeDisabled();
      await expect(retryRole).toBeEnabled({ timeout: 5_000 });
      await retryRole.click();
      await expect(page.getByTestId("me-onboarding-retry-role-confirm")).toHaveCount(0);
      await expect(page.getByRole("main")).toContainText("onboarding_role_confirm_db", { timeout: 30_000 });
    } finally {
      await page.unroute("**/api/v1/onboarding/role-confirm");
    }
  });

  test("logged-in: payment-intents 503 compliance screening unavailable — route mock (no retry)", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    await page.route("**/api/v1/onboarding/payment-intents", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          error: "onboarding_compliance_screening_unavailable",
          message: "onboarding_compliance_screening_unavailable",
        }),
      });
    });

    try {
      await gotoWithBearerSession(page, "/me/onboarding", creds);
      await expect(page.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
        timeout: 90_000,
      });
      await expect(page.getByRole("main")).toContainText(/onboarding_entitlements_(stub|db)/, {
        timeout: 90_000,
      });
      await expect(page.getByTestId("me-onboarding-create-intent")).toBeVisible({ timeout: 90_000 });
      await expect(page.getByTestId("me-onboarding-retry-payment-intent")).toHaveCount(0);
      await page.getByTestId("me-onboarding-create-intent").click();
      await expect(page.getByRole("main")).toContainText(/Compliance list file|合规名单文件不可用/, {
        timeout: 30_000,
      });
      await expect(page.getByTestId("me-onboarding-retry-payment-intent")).toHaveCount(0);
    } finally {
      await page.unroute("**/api/v1/onboarding/payment-intents");
    }
  });

  test("logged-in: role-confirm 503 compliance screening unavailable — route mock (no retry)", async ({
    page,
    request,
  }) => {
    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const meProbe = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    test.skip(!meProbe.ok(), `onboarding entitlements HTTP ${meProbe.status()}`);
    const ej = (await meProbe.json()) as { meta?: { implementation_status?: string } };
    const entStatus = ej?.meta?.implementation_status;
    test.skip(
      entStatus !== "onboarding_entitlements_stub" && entStatus !== "onboarding_entitlements_db",
      "API not in onboarding_entitlements_stub or onboarding_entitlements_db mode",
    );

    await page.route("**/api/v1/onboarding/role-confirm", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          error: "onboarding_compliance_screening_unavailable",
          message: "onboarding_compliance_screening_unavailable",
        }),
      });
    });

    try {
      await gotoWithBearerSession(page, "/me/onboarding", creds);
      await expect(page.getByRole("heading", { level: 1, name: /onboarding|准入/i })).toBeVisible({
        timeout: 90_000,
      });
      await expect(page.getByRole("main")).toContainText(/onboarding_entitlements_(stub|db)/, {
        timeout: 90_000,
      });
      await expect(page.getByTestId("me-onboarding-role-confirm")).toBeVisible({ timeout: 90_000 });
      await expect(page.getByTestId("me-onboarding-retry-role-confirm")).toHaveCount(0);
      await page.getByTestId("me-onboarding-role-confirm").click();
      await expect(page.getByRole("main")).toContainText(/Compliance list file|合规名单文件不可用/, {
        timeout: 30_000,
      });
      await expect(page.getByTestId("me-onboarding-retry-role-confirm")).toHaveCount(0);
    } finally {
      await page.unroute("**/api/v1/onboarding/role-confirm");
    }
  });

  test("optional: PG + internal webhook — intent then webhook JSON → paid (no shell)", async ({ page, request }) => {
    const secret =
      process.env.PLAYWRIGHT_INTERNAL_API_SECRET?.trim() || process.env.INTERNAL_API_SECRET?.trim();
    test.skip(!secret, "PLAYWRIGHT_INTERNAL_API_SECRET / INTERNAL_API_SECRET unset — skip closed-loop");

    const apiBase = defaultApiBase();
    await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
    const creds = await apiLoginReturnCredentials(request, apiBase, "tourist@test.com", "Test123!");
    test.skip(!creds, "API login unavailable (skip)");

    const idem = crypto.randomUUID();
    const piRes = await request.post(`${apiBase}/api/v1/onboarding/payment-intents`, {
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idem,
      },
      data: { role: "provider" },
    });
    if (piRes.status() === 503) {
      test.skip(true, `payment-intents HTTP ${piRes.status()} (no DB pool / kill switch / chain_off)`);
    }
    expect(piRes.ok(), `payment-intents expected 200, got ${piRes.status()}`).toBeTruthy();
    const piBody = (await piRes.json()) as { status?: string };
    expect(piBody.status).toBe("ok");

    const webhookPayload = {
      schema_version: 1,
      idempotency_key: idem,
      provider_event_id: `evt_e2e_${idem.replace(/-/g, "").slice(0, 12)}`,
      outcome: "succeeded",
    };
    const rawBody = JSON.stringify(webhookPayload);
    const hmacSecret = process.env.ONBOARDING_WEBHOOK_HMAC_SECRET?.trim();
    const xff =
      process.env.PLAYWRIGHT_ONBOARDING_WEBHOOK_X_FORWARDED_FOR?.trim() ||
      process.env.ONBOARDING_WEBHOOK_X_FORWARDED_FOR?.trim() ||
      "127.0.0.1";
    const xfProto =
      process.env.PLAYWRIGHT_ONBOARDING_WEBHOOK_X_FORWARDED_PROTO?.trim() ||
      process.env.ONBOARDING_WEBHOOK_X_FORWARDED_PROTO?.trim() ||
      "https";
    const whHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Api-Secret": secret,
      "X-Forwarded-For": xff,
      "X-Forwarded-Proto": xfProto,
    };
    if (hmacSecret) {
      const hex = createHmac("sha256", hmacSecret).update(rawBody).digest("hex");
      whHeaders["X-Onboarding-Webhook-Signature"] = `v1=${hex}`;
    }

    const whRes = await request.post(`${apiBase}/api/v1/internal/onboarding/payments/webhook`, {
      headers: whHeaders,
      data: rawBody,
    });
    if (whRes.status() === 400 || whRes.status() === 403) {
      const errBody = (await whRes.json().catch(() => ({}))) as { error?: string };
      const e = errBody.error;
      test.skip(
        e === "onboarding_webhook_signature_required" || e === "onboarding_webhook_invalid_signature",
        "API requires ONBOARDING_WEBHOOK_HMAC_SECRET — align secret for E2E or unset for local",
      );
      test.skip(
        e === "onboarding_webhook_https_forwarded_required" ||
          e === "onboarding_webhook_peer_ip_unknown" ||
          e === "onboarding_webhook_peer_ip_forbidden",
        "API edge gate (ONBOARDING_INTERNAL_WEBHOOK_*) — include client IP in allowlist (e.g. 127.0.0.1/32) and X-Forwarded-Proto: https, or set PLAYWRIGHT_ONBOARDING_WEBHOOK_X_FORWARDED_FOR to match allowlist",
      );
    }
    expect(whRes.ok(), `internal onboarding webhook expected 2xx, got ${whRes.status()}`).toBeTruthy();

    const entRes = await request.get(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    expect(entRes.ok()).toBeTruthy();
    const ent = (await entRes.json()) as { entitlements?: { status?: string }[] };
    const hasPaid = ent.entitlements?.some((e) => e.status === "paid") ?? false;
    expect(hasPaid).toBeTruthy();

    await gotoWithBearerSession(page, "/me/onboarding", creds);
    await expect(page.getByRole("main")).toContainText('"status": "paid"', { timeout: 90_000 });
  });
});
