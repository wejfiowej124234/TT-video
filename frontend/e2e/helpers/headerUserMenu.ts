import { expect, type Page } from "@playwright/test";

import { headerUserMenuDropdownShell, headerUserMenuShell } from "./pageShells";

/** 已登录顶栏用户菜单触发器（`Header` `UserMenu`）。 */
export function headerUserMenuTrigger(page: Page) {
  return headerUserMenuShell(page);
}

/** 打开顶栏用户下拉（已登录 · Auth L5）。须先 `gotoWithHeaderNavSessionReady` / `ensureCommunityBrowserSessionAccepted`。 */
export async function openHeaderUserMenuDropdown(page: Page) {
  const trigger = headerUserMenuTrigger(page);
  await expect(trigger).toBeVisible({ timeout: 90_000 });
  await trigger.click();
  const dropdown = headerUserMenuDropdownShell(page);
  await expect(dropdown).toBeVisible({ timeout: 90_000 });
  return dropdown;
}

/** 顶栏用户菜单 → 登出（L5 确认 · `HeaderUserMenuL5Logout`） */
export async function uiLogout(page: Page) {
  const dropdown = await openHeaderUserMenuDropdown(page);
  const logoutBtn = dropdown.locator('[data-tt-header-logout-l5="1"]');
  if ((await logoutBtn.count()) > 0) {
    await logoutBtn.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 25_000 });
    await dialog.getByRole("button", { name: /Log out|登出|退出/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 25_000 });
  } else {
    await dropdown.getByRole("menuitem", { name: /Log out|登出|退出/i }).click();
  }
  await expect(headerUserMenuTrigger(page)).toHaveCount(0, { timeout: 90_000 });
}
