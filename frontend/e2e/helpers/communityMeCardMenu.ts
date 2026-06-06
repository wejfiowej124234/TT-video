import { expect, type Locator, type Page } from "@playwright/test";

/** 打开个人中心帖格 ⋮ 溢出菜单（`CommunityMeNotesCardOverflowMenu`）。 */
export async function openCommunityMePostCardMenu(page: Page, scope?: Locator): Promise<Locator> {
  const root = scope ?? page;
  const menuBtn = root.getByRole("button", { name: /帖子卡片菜单|Post card menu/i }).first();
  await expect(menuBtn).toBeVisible({ timeout: 15_000 });
  await menuBtn.click({ force: true });
  await expect(menuBtn).toHaveAttribute("aria-expanded", "true", { timeout: 10_000 });
  await expect(page.getByRole("menu").first()).toBeVisible({ timeout: 10_000 });
  return menuBtn;
}

export function communityMePostCardDeleteMenuitem(page: Page) {
  return page.getByRole("menuitem", { name: /^(删除|Delete)$/ });
}
