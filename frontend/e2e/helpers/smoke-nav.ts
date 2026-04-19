import type { Page } from "@playwright/test";

/** 与 TT-L4 基线一致：默认 `page.goto`（`waitUntil: "load"`），不在此处改用 `domcontentloaded`。 */
export async function gotoSmoke(page: Page, url: string): Promise<void> {
  await page.goto(url);
}

const SMOKE_ADMIN_USER_ID = "e2e-smoke-admin";

/** 管理后台烟雾用例共用的 middleware 占位 Cookie（与拆分前 `smoke.spec.ts` 内联逻辑一致）。 */
export async function addSmokeAdminCookies(page: Page, baseURL: string | undefined): Promise<void> {
  const origin = baseURL ?? "http://localhost:3012";
  await page.context().addCookies([{ name: "traveltrust_user_id", value: SMOKE_ADMIN_USER_ID, url: origin }]);
}
