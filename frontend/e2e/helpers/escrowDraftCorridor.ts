import { expect, type Page } from "@playwright/test";

/** Experience 草稿：保存并发布到 discover（未发布时无需先改行程） */
export async function saveEscrowItineraryPublish(page: Page) {
  const saveBtn = page.getByRole("button", { name: /保存行程|Save itinerary/i }).first();
  await saveBtn.scrollIntoViewIfNeeded();
  await expect(saveBtn).toBeVisible({ timeout: 90_000 });
  await saveBtn.click();
  await expect(
    page.getByText(/已发布到自由市场|Published to the free market|保存成功 · 已发布/i).first(),
  ).toBeVisible({ timeout: 90_000 });
}
