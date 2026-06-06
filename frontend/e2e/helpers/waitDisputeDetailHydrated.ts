import { expect, type Page } from "@playwright/test";

import { disputeDetailPageShell } from "./pageShells";

/**
 * `app/disputes/[id]/loading.tsx` 与真实详情共用 `data-tt-dispute-detail-page`；
 * 仅用 shell `toBeVisible` 会停在骨架屏。真实页含 `h1.text-h4`（争议标题）。
 */
export async function waitDisputeDetailPageHydrated(page: Page) {
  const shell = disputeDetailPageShell(page);
  await expect(shell.locator("h1.text-h4")).toBeVisible({ timeout: 90_000 });
}
