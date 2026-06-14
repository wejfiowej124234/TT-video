import { expect, type Page } from "@playwright/test";

/** 行程日期已自动带入：日历展示 `[data-tt-guide-trip-selected]`，预约 CTA 可点 */
export async function assertGuideItineraryTripAutoSelected(page: Page): Promise<void> {
  await expect(page.locator('[data-tt-guide-trip-selected="1"]')).toBeVisible({ timeout: 45_000 });
  const bookBtn = page.locator('[data-tt-guide-detail-book-cta="1"]');
  await expect(bookBtn).toBeVisible({ timeout: 15_000 });
  await expect(bookBtn).toBeEnabled({ timeout: 30_000 });
}

/** 市场 bind 模式：展示行程出行日期横幅 */
export async function assertMarketBindTripLabelVisible(page: Page): Promise<void> {
  await expect(
    page.getByText(/行程出行：|Itinerary trip:/i).first(),
  ).toBeVisible({ timeout: 60_000 });
}

/** 市场向导列表：打开首张可查看卡片的抽屉，返回 guideId */
export async function openFirstGuideDrawerFromMarket(page: Page): Promise<string> {
  const viewBtn = page.getByRole("button", { name: /View guide|查看向导/i }).first();
  await expect(viewBtn).toBeVisible({ timeout: 90_000 });
  await viewBtn.click({ timeout: 20_000 });
  const drawer = page.getByRole("dialog", { name: /Guide details|向导详情/i });
  await expect(drawer).toBeVisible({ timeout: 15_000 });
  const viewPageLink = drawer.getByRole("link", { name: /View guide page|查看向导页/i });
  await expect(viewPageLink).toBeVisible({ timeout: 15_000 });
  const href = (await viewPageLink.getAttribute("href")) ?? "";
  const match = href.match(/\/guides\/([^/?#]+)/);
  const guideId = match?.[1] ? decodeURIComponent(match[1]) : "";
  expect(guideId.length).toBeGreaterThan(0);
  return guideId;
}
