import { expect, type Page } from "@playwright/test";

function isPostCreateOrder(res: import("@playwright/test").Response): boolean {
  const u = res.url();
  if (res.request().method() !== "POST") return false;
  if (!u.includes("/api/v1/orders")) return false;
  if (u.includes("/reviews") || u.includes("/mock-pay") || u.includes("/accept")) return false;
  if (u.includes("/confirm-completion")) return false;
  return /\/api\/v1\/orders(?:\?|$)/.test(u) || u.endsWith("/orders");
}

/** `/orders/new` L5：向导摘要横幅 + 金额 → POST 建单（无 combobox） */
export async function postCreateOrderFromOrdersNew(page: Page, guideId: string): Promise<string> {
  await expect(page).toHaveURL(new RegExp(`/orders/new.*guide_id=${guideId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), {
    timeout: 45_000,
  });
  await expect(page.locator('[data-tt-orders-new-guide-summary="1"]')).toBeVisible({ timeout: 25_000 });

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

/** 向导详情日历：选连续两天（可订格） */
export async function pickGuideTripDatesOnDetailPage(page: Page): Promise<void> {
  const freeCells = page.locator('[data-tt-guide-availability-selected]').locator("..").first();
  const pickable = page.locator('button[aria-label*="可订"], button[aria-label*="free"]');
  await expect(pickable.first()).toBeVisible({ timeout: 30_000 });
  const count = await pickable.count();
  expect(count).toBeGreaterThan(1);
  await pickable.nth(0).click();
  await pickable.nth(1).click();
  await expect(page.locator('[data-tt-guide-trip-selected="1"]')).toBeVisible({ timeout: 10_000 });
  void freeCells;
}
