/**
 * E2E UI 契约层：仅 `data-tt-*` 壳 / 角色边界 / URL，禁止动态文案 heading 断言。
 * 选择器真源：`test-utils/dataTtSelectors.ts` · `e2e/helpers/pageShells.ts`。
 */
import { expect, type Locator, type Page } from "@playwright/test";

import { dataTt } from "../../test-utils/dataTtSelectors";

export const UI_CONTRACT_TIMEOUT_MS = 90_000;

export function shellFirst(shell: Locator): Locator {
  return shell.first();
}

export async function expectUiShellVisible(
  shell: Locator,
  timeoutMs = UI_CONTRACT_TIMEOUT_MS,
): Promise<void> {
  await expect(shellFirst(shell)).toBeVisible({ timeout: timeoutMs });
}

export async function expectUiShellAttached(
  shell: Locator,
  timeoutMs = UI_CONTRACT_TIMEOUT_MS,
): Promise<void> {
  await expect(shellFirst(shell)).toBeAttached({ timeout: timeoutMs });
}

export function meIdentitiesHubShell(page: Page): Locator {
  return page.locator('[data-tt-me-identities-l5="1"]');
}

export function meSettingsProfileShell(page: Page): Locator {
  return page.locator('[data-tt-me-settings-profile="1"]');
}

export function ordersNewGuideSummaryShell(page: Page): Locator {
  return page.locator('[data-tt-orders-new-guide-summary="1"]');
}

export function escrowProtocolZoneShell(page: Page): Locator {
  return page.locator('[data-zone="order-protocol"]');
}

export function adminHomeShell(page: Page): Locator {
  return page.locator('[data-tt-admin-home="1"]');
}

export function adminListPageShell(page: Page): Locator {
  return page.locator('[data-tt-admin-list-page="1"]');
}

export function adminDetailPageShell(page: Page): Locator {
  return page.locator('[data-tt-admin-detail-page="1"]');
}

export async function expectUrlMatches(page: Page, pattern: RegExp, timeoutMs = UI_CONTRACT_TIMEOUT_MS) {
  await expect(page).toHaveURL(pattern, { timeout: timeoutMs });
}

export { dataTt };
