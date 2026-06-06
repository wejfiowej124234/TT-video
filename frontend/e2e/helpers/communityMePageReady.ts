import { expect, type Page } from "@playwright/test";

import { ensureCommunityBrowserSessionAccepted, type BearerSessionCredentials } from "./apiSession";
import {
  communityMeCollectsPageShell,
  communityMeLikesPageShell,
  communityMePostsPageShell,
  communityMeReportsPageShell,
} from "./pageShells";

/** 会话就绪后轮询独立帖页 shell（parity 暖序后使用；勿叠 hub 90s + posts 90s 超 120s test timeout）。 */
export async function expectCommunityMePostsPageShellReady(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await ensureCommunityBrowserSessionAccepted(page, session, timeoutMs);
  await expect
    .poll(async () => communityMePostsPageShell(page).isVisible(), { timeout: timeoutMs })
    .toBe(true);
}

export async function expectCommunityMeCollectsPageShellReady(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await ensureCommunityBrowserSessionAccepted(page, session, timeoutMs);
  await expect
    .poll(async () => communityMeCollectsPageShell(page).isVisible(), { timeout: timeoutMs })
    .toBe(true);
}

export async function expectCommunityMeLikesPageShellReady(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await ensureCommunityBrowserSessionAccepted(page, session, timeoutMs);
  await expect
    .poll(async () => communityMeLikesPageShell(page).isVisible(), { timeout: timeoutMs })
    .toBe(true);
}

export async function expectCommunityMeReportsPageShellReady(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  await ensureCommunityBrowserSessionAccepted(page, session, timeoutMs);
  await expect
    .poll(async () => communityMeReportsPageShell(page).isVisible(), { timeout: timeoutMs })
    .toBe(true);
}
