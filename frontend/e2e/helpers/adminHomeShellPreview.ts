import { expect, type Page } from "@playwright/test";

/** ① 工作台聚焦时预览横幅可能在维护者折叠内（`AdminHomeMaintainerFold`）。 */
export async function expectAdminHomeShellPreviewBanner(page: Page): Promise<void> {
  const banner = page.locator('[data-tt-admin-home-shell-preview-banner="1"]');
  const deferred = page.locator('[data-tt-admin-home-shell-preview-deferred="1"]');

  await expect(banner.or(deferred)).toBeVisible({ timeout: 15_000 });

  if ((await deferred.count()) > 0 && !(await banner.isVisible())) {
    await page.locator('[data-tt-admin-home-maintainer-fold="1"] summary').click();
  }

  await expect(banner).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-tt-admin-home-shell-preview-readonly="1"]')).toBeVisible();
}
