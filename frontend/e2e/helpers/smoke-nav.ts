import type { Locator, Page } from "@playwright/test";

export type SmokeNavOptions = {
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  timeout?: number;
};

/** 与 TT-L4 基线一致：默认 `page.goto`（`waitUntil: "load"`），不在此处改用 `domcontentloaded`。 */
export async function gotoSmoke(page: Page, url: string, opts?: SmokeNavOptions): Promise<void> {
  if (opts) {
    await page.goto(url, opts);
    return;
  }
  await page.goto(url);
}

export async function reloadSmoke(page: Page, opts?: SmokeNavOptions): Promise<void> {
  if (opts) {
    await page.reload(opts);
    return;
  }
  await page.reload();
}

export async function waitForUrlSmoke(
  page: Page,
  url: string | RegExp,
  opts?: { timeout?: number },
): Promise<void> {
  await page.waitForURL(url, opts);
}

/** 瞬断重试 reload 前 settle，避免紧循环假红（`gotoLoginWhenReady` 等同源）。 */
export function e2eTransientRetrySettleMs(attempt: number): number {
  return 400 + attempt * 600;
}

const SMOKE_ADMIN_USER_ID = "e2e-smoke-admin";

/** 管理后台烟雾用例共用的 middleware 占位 Cookie（须与 Bearer token 对齐，勿仅 user_id）。 */
export async function addSmokeAdminCookies(page: Page, baseURL: string | undefined): Promise<void> {
  const origin = baseURL ?? "http://localhost:3012";
  await page.context().addCookies([
    { name: "traveltrust_user_id", value: SMOKE_ADMIN_USER_ID, url: origin },
    { name: "traveltrust_session_ok", value: "1", url: origin },
  ]);
  await page.addInitScript((uid) => {
    localStorage.setItem("traveltrust_user_id", uid);
    localStorage.setItem("traveltrust_session_token", "e2e-smoke-opaque-token");
  }, SMOKE_ADMIN_USER_ID);
}

/** 管理后台壳 `data-tt-admin-app-page="1"`（与 `test-utils/dataTtSelectors` 同源）。 */
export function adminAppPageMainLocator(page: Page): Locator {
  return page.locator('[data-tt-admin-app-page="1"]');
}
