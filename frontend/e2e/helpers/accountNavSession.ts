import { expect, type Page } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  type BearerSessionCredentials,
} from "./apiSession";
import { communityMePageShell, ordersPageShell } from "./pageShells";

/** 写入 Bearer 后等浏览器侧 `GET /api/v1/me` 200，顶栏 `HeaderUserMenu` 才会挂载。 */
export async function gotoWithHeaderNavSessionReady(
  page: Page,
  path: string,
  creds: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await gotoWithBearerSession(page, path, creds);
  if (path === "/orders" || path.startsWith("/orders/")) {
    await expect(ordersPageShell(page)).toBeVisible({ timeout: timeoutMs });
  }
  if (path === "/community/me" || path.startsWith("/community/me")) {
    await expect(communityMePageShell(page)).toBeVisible({ timeout: timeoutMs });
  }
  await ensureCommunityBrowserSessionAccepted(page, creds, timeoutMs);
}

/** `/me/settings*` 族：Bearer + `GET /api/v1/me`（Hub 状态条 / 安全子页同源）。 */
export async function gotoWithMeSettingsSessionReady(
  page: Page,
  path: string,
  creds: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await gotoWithBearerSession(page, path, creds);
  await ensureCommunityBrowserSessionAccepted(page, creds, timeoutMs);
}
