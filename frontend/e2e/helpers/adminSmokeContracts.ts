/**
 * smoke-admin · 路由可达性契约（list / detail / home 壳），禁止 h1 文案断言。
 * 判定：goto + data-tt-admin-* state commit（禁止 reload 重试环）。
 */
import type { Page } from "@playwright/test";

import { gotoSmoke } from "./smoke-nav";
import {
  adminDetailPageShell,
  adminHomeShell,
  adminListPageShell,
  expectUiShellVisible,
  expectUrlMatches,
  UI_CONTRACT_TIMEOUT_MS,
} from "./uiContractLayer";

export type AdminSmokeShellKind = "home" | "list" | "detail";

const ADMIN_SMOKE_TIMEOUT_MS = UI_CONTRACT_TIMEOUT_MS;

function shellForKind(page: Page, kind: AdminSmokeShellKind) {
  if (kind === "home") return adminHomeShell(page);
  if (kind === "list") return adminListPageShell(page);
  return adminDetailPageShell(page);
}

function headerMarkerForKind(kind: AdminSmokeShellKind): string {
  if (kind === "list") return '[data-tt-admin-list-page-header="1"]';
  if (kind === "detail") return '[data-tt-admin-detail-page-header="1"]';
  return '[data-tt-admin-home-workspace-header="1"]';
}

export async function gotoSmokeAdminRoute(
  page: Page,
  path: string,
  opts?: { placeholder?: boolean },
): Promise<void> {
  await gotoSmoke(page, path, {
    waitUntil: "domcontentloaded",
    timeout: ADMIN_SMOKE_TIMEOUT_MS,
  });
  if (opts?.placeholder) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expectUrlMatches(page, new RegExp(escaped), ADMIN_SMOKE_TIMEOUT_MS);
  }
}

export async function expectAdminSmokeShell(
  page: Page,
  kind: AdminSmokeShellKind,
  timeoutMs = ADMIN_SMOKE_TIMEOUT_MS,
): Promise<void> {
  const shell = shellForKind(page, kind);
  await expectUiShellVisible(shell, timeoutMs);
  await expectUiShellVisible(page.locator('[data-tt-admin-app-page="1"]'), timeoutMs);
  await expectUiShellVisible(page.locator(headerMarkerForKind(kind)), timeoutMs);
}

export async function expectAdminSmokeListRoute(page: Page, path: string): Promise<void> {
  await gotoSmokeAdminRoute(page, path);
  await expectAdminSmokeShell(page, "list");
}

export async function expectAdminSmokeDetailRoute(page: Page, path: string): Promise<void> {
  await gotoSmokeAdminRoute(page, path, { placeholder: true });
  await expectAdminSmokeShell(page, "detail");
}

export async function expectAdminSmokeHomeRoute(page: Page): Promise<void> {
  await gotoSmokeAdminRoute(page, "/admin");
  await expectAdminSmokeShell(page, "home");
}
