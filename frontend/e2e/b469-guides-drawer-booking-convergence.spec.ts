/**
 * B-469：`/guides/[id]` 与 **`GuideDetailDrawer`** 预约入口的浏览器 E2E；
 * 对照 B-468 验证二者均经同一 **`BookGuideModal`**、同一 **`/orders/new?guide_id=`**
 *（`ordersNewHrefForGuide`）与同一 **`POST /api/v1/orders`** 建单闭环（不展开商家/管理端）。
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { guideRowIdForSeedGuideAccount } from "./helpers/guideSeedGuideRowId";
import { releaseSeedGuideSlotIfBlocked } from "./helpers/releaseSeedGuideSlot";

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
): Promise<void> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

function isPostCreateOrder(res: import("@playwright/test").Response): boolean {
  const u = res.url();
  if (res.request().method() !== "POST") return false;
  if (!u.includes("/api/v1/orders")) return false;
  if (u.includes("/reviews") || u.includes("/mock-pay") || u.includes("/accept")) return false;
  if (u.includes("/confirm-completion")) return false;
  return /\/api\/v1\/orders(?:\?|$)/.test(u) || u.endsWith("/orders");
}

/** `BookGuideModal` 已打开：点击「选择行程并预约」→ `/orders/new?guide_id=` */
async function clickModalSelectItineraryToOrdersNew(page: Page, guideId: string): Promise<void> {
  await expect(page.getByRole("dialog", { name: /Book guide|预约向导/i })).toBeVisible({
    timeout: 15_000,
  });
  await Promise.all([
    page.waitForURL(
      (url) =>
        url.pathname === "/orders/new" && url.searchParams.get("guide_id") === guideId,
      { timeout: 45_000 }
    ),
    page.getByRole("link", { name: /Select itinerary|选择行程并预约/i }).click(),
  ]);
}

async function postCreateOrderFromOrdersNew(page: Page, guideId: string): Promise<string> {
  const guideSelect = page.getByRole("combobox", { name: /Guides|向导列表/i });
  await expect(guideSelect).toBeVisible({ timeout: 25_000 });
  await expect
    .poll(async () => guideSelect.locator("option").count(), { timeout: 40_000 })
    .toBeGreaterThan(1);
  await expect(guideSelect).toHaveValue(guideId);

  const amount = `51.${Date.now().toString().slice(-4)}`;
  await page.getByLabel(/Amount|金额/i).fill(amount);

  const [createResponse] = await Promise.all([
    page.waitForResponse((res) => isPostCreateOrder(res) && res.ok(), { timeout: 60_000 }),
    page.getByRole("button", { name: /Create order|创建订单/i }).click(),
  ]);
  const createdJson = (await createResponse.json()) as { order?: { id?: string } };
  const orderId = (createdJson.order?.id ?? "").trim();
  expect(orderId.length).toBeGreaterThan(10);
  await expect(page.getByText(/Order created|订单已创建/i).first()).toBeVisible({
    timeout: 25_000,
  });
  return orderId;
}

/** 市场 · Guides：打开抽屉 → 抽屉内「预约」→ `BookGuideModal` */
async function openBookModalFromGuideDrawer(page: Page, guideId: string): Promise<void> {
  await page.getByRole("tab", { name: /^Guides$|^向导$/ }).click();
  const guideCard = page.getByRole("article").filter({
    has: page.locator(`h3#guide-title-${guideId}`),
  });
  await expect(guideCard).toBeVisible({ timeout: 90_000 });

  await guideCard.getByRole("button", { name: /View guide|查看向导/i }).click({ timeout: 20_000 });

  const drawer = page.getByRole("dialog", { name: /Guide details|向导详情/i });
  await expect(drawer).toBeVisible({ timeout: 15_000 });
  await drawer.getByRole("button", { name: /Book guide|预约向导/i }).click({ timeout: 15_000 });

  await expect(page.getByRole("dialog", { name: /Book guide|预约向导/i })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("B-469 · /guides/[id] & GuideDetailDrawer → BookGuideModal → orders/new (B-468 parity)", () => {
  test("GuideDetailDrawer → 预约 → 建单（与 B-468 同源弹层与 query）", async ({ page, request }) => {
    test.setTimeout(360_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await apiLogin(request, "tourist@test.com", "Test123!");

    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    expect(guideId, "guide@test guide.id").toBeTruthy();

    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent("/market")}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForURL(/\/market/, { timeout: 30_000 });

    await openBookModalFromGuideDrawer(page, guideId);
    await clickModalSelectItineraryToOrdersNew(page, guideId);

    await expect(page).toHaveURL(
      (u) => u.pathname === "/orders/new" && u.searchParams.get("guide_id") === guideId
    );

    await postCreateOrderFromOrdersNew(page, guideId);
  });

  test("/guides/[id] → 预约按钮 → BookGuideModal → 建单（与 B-468 同源）", async ({ page, request }) => {
    test.setTimeout(360_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await request
      .post(`${API_BASE}/auth/seed-test-accounts`, {
        headers: { "Content-Type": "application/json" },
        data: "{}",
      })
      .catch(() => null);
    await releaseSeedGuideSlotIfBlocked(request, API_BASE);
    await apiLogin(request, "tourist@test.com", "Test123!");

    const guideId = await guideRowIdForSeedGuideAccount(request, API_BASE);
    expect(guideId, "guide@test guide.id").toBeTruthy();

    const detailPath = `/guides/${encodeURIComponent(guideId)}`;
    await gotoLoginWhenReady(page, `/auth/login?returnUrl=${encodeURIComponent(detailPath)}`);
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill("tourist@test.com");
    await page.getByLabel(/password|密码/i).fill("Test123!");
    await page.getByRole("button", { name: /Log in|登录/i }).click();
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp(`/guides/${guideId}`), { timeout: 30_000 });

    await page
      .getByRole("button", { name: /Order from this guide|向该向导下单/i })
      .click({ timeout: 20_000 });

    await clickModalSelectItineraryToOrdersNew(page, guideId);

    await expect(page).toHaveURL(
      (u) => u.pathname === "/orders/new" && u.searchParams.get("guide_id") === guideId
    );

    await postCreateOrderFromOrdersNew(page, guideId);
  });
});
