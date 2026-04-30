import { expect, type Page } from "@playwright/test";

/**
 * 登录按钮触发 Next `router.replace` 时，Playwright `waitForURL` 默认 `waitUntil: "load"` 会等不到第二次 `load`。
 * 与 `waitUntil: "commit"` 组合，并在导航后等待顶栏用户菜单（依赖 `/me`）。
 */
export async function clickLoginWaitClientUrl(
  page: Page,
  url: Parameters<Page["waitForURL"]>[0],
  options?: { navTimeout?: number; menuTimeout?: number },
) {
  const navTimeout = options?.navTimeout ?? 45_000;
  const menuTimeout = options?.menuTimeout ?? 35_000;
  await Promise.all([
    page.waitForURL(url, { timeout: navTimeout, waitUntil: "commit" }),
    page.getByRole("button", { name: /Log in|登录/i }).click(),
  ]);
  await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
    timeout: menuTimeout,
  });
}
