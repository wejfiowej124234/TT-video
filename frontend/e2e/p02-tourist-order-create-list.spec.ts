/**
 * TT-TOURIST-JOURNEY-P02-CREATE-ORDER-LIST-001：登录 → 建单 → /orders 可见新单。
 * 向导 ID 由 API 预取：`/orders/new` 在 `getGuides` 空列表时仍可用 `?guide_id=` 注入选项（见 app/orders/new/page.tsx）。
 * 链参与：建单后若 `GET /meta` 含 **`escrow_platform_fee_recipient`**，则断言 **B-095**
 * `GET /api/v1/orders/:id` → `order.split_addresses_ssot.platform_fee_recipient` 与之同源。
 */
import { test, expect } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("P02 create order + list", () => {
  test("登录后从 /orders/new 创建订单，/orders 列表出现该单", async ({ page, request }) => {
    test.setTimeout(120_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不通：${API_HEALTH} 不可用；请先起 traveltrust-api`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);

    await releaseSeedGuideSlotIfBlocked(request, API_BASE);

    const loginApi = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    if (!loginApi.ok()) {
      test.skip(true, `API 不通：登录 HTTP ${loginApi.status()}`);
    }
    const loginJson = (await loginApi.json()) as { token?: string };
    const token = loginJson.token?.trim();
    if (!token) {
      test.skip(true, "API 不通：登录未返回 token");
    }

    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    if (!guideId) {
      test.skip(true, "向导种子缺失：guide@test GET /me 无 guide.id（需 SEED_TEST_ACCOUNTS）");
    }

    const newUrl = `/orders/new?guide_id=${encodeURIComponent(guideId)}`;
    await page.goto(
      `/auth/login?returnUrl=${encodeURIComponent(newUrl)}`,
    );
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();

    await page.waitForURL(/\/orders\/new/, { timeout: 25_000 });
    if (!page.url().includes("guide_id=")) {
      await page.goto(`/orders/new?guide_id=${encodeURIComponent(guideId)}`);
    }

    const guideSelect = page.getByRole("combobox", { name: /向导列表|guides/i });
    await expect(guideSelect).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => guideSelect.locator("option").count(), { timeout: 30_000 })
      .toBeGreaterThan(1);

    await guideSelect.selectOption({ value: guideId });

    const amount = `42.${Date.now().toString().slice(-4)}`;
    await page.getByLabel(/金额|amount/i).fill(amount);
    await page.getByRole("button", { name: /创建订单|Create order/i }).click();

    const goOrdersLink = page.locator('a[href*="expect_order"]');
    await expect(goOrdersLink).toBeVisible({ timeout: 25_000 });

    await Promise.all([
      page.waitForURL(/\/orders\?expect_order=/, { timeout: 30_000 }),
      goOrdersLink.click(),
    ]);
    // 列表展示为「金额 + 币种」（app/orders/page.tsx），非裸数字
    await expect(page.getByText(`${amount} USD`, { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("article").first()).toBeVisible();

    const listUrl = page.url();
    const expectOrderMatch = listUrl.match(/[?&]expect_order=([^&]+)/);
    if (token && expectOrderMatch) {
      const orderId = decodeURIComponent(expectOrderMatch[1]!);
      const metaRes = await request.get(`${API_BASE}/meta`);
      expect(metaRes.ok()).toBeTruthy();
      const meta = (await metaRes.json()) as {
        chain?: { contracts?: { escrow_platform_fee_recipient?: unknown } };
      };
      const platformRecipient = meta.chain?.contracts?.escrow_platform_fee_recipient;
      if (typeof platformRecipient === "string" && /^0x[a-fA-F0-9]{40}$/.test(platformRecipient)) {
        const ordRes = await request.get(`${API_BASE}/api/v1/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(ordRes.ok(), `GET /api/v1/orders/${orderId}`).toBeTruthy();
        const ordBody = (await ordRes.json()) as {
          order?: { split_addresses_ssot?: { platform_fee_recipient?: string } };
        };
        expect(ordBody.order?.split_addresses_ssot?.platform_fee_recipient).toBe(platformRecipient);
      }
    }
  });
});
