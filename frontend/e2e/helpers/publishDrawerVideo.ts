import { expect, type Locator, type Page } from "@playwright/test";

import { gotoWithBearerSession, ensureCommunityBrowserSessionAccepted } from "./apiSession";
import { communityPublishDrawerShell } from "./pageShells";

function publishDrawerInnerSheet(drawer: Locator): Locator {
  return drawer.locator('[data-tt-publish-drawer-type]');
}

function publishDrawerVideoTypeButton(drawer: Locator): Locator {
  return drawer.getByRole("button", { name: /^(Video|视频)$/ });
}

function publishDrawerVideoFileInput(drawer: Locator): Locator {
  return drawer.locator('input[type="file"][accept*="video"]');
}

/** 等抽屉内 capabilities 就绪（`public_video_publish_ready`）且「视频」类型可点。 */
export async function waitForPublishDrawerVideoTypeEnabled(
  _page: Page,
  drawer: Locator,
  timeoutMs = 180_000,
): Promise<void> {
  const videoBtn = publishDrawerVideoTypeButton(drawer);
  await expect(videoBtn).toBeVisible({ timeout: timeoutMs });
  await expect(videoBtn).toBeEnabled({ timeout: timeoutMs });
}

/** 选「视频」并等 `PublishDrawerVideoSection` 挂上 file input。 */
export async function selectPublishDrawerVideoType(
  page: Page,
  drawer: Locator,
  timeoutMs = 180_000,
): Promise<void> {
  const videoInput = publishDrawerVideoFileInput(drawer);
  const videoSection = drawer.getByRole("group", { name: /Add video|添加视频/i });

  if ((await videoInput.count()) > 0) {
    await expect(videoSection).toBeVisible({ timeout: 60_000 });
    await expect(publishDrawerInnerSheet(drawer)).toHaveAttribute("data-tt-publish-drawer-type", "video", {
      timeout: 30_000,
    });
    return;
  }

  await waitForPublishDrawerVideoTypeEnabled(page, drawer, timeoutMs);
  const videoBtn = publishDrawerVideoTypeButton(drawer);
  await videoBtn.scrollIntoViewIfNeeded();
  await videoBtn.click();

  await expect(publishDrawerInnerSheet(drawer)).toHaveAttribute("data-tt-publish-drawer-type", "video", {
    timeout: timeoutMs,
  });
  await expect(videoSection).toBeVisible({ timeout: timeoutMs });
  await expect(videoInput).toHaveCount(1, { timeout: timeoutMs });
}

/** 与 FE-04/03 同源：`/community?publish=1` 直开抽屉。 */
export async function openCommunityPublishDrawerViaQuery(
  page: Page,
  cred: CommunityPublishDrawerLoginCred,
  timeoutMs = 120_000,
): Promise<Locator> {
  await gotoWithBearerSession(page, "/community?publish=1", cred);
  await page.waitForSelector('[data-tt-community-feed-page="1"]', { timeout: timeoutMs });
  await ensureCommunityBrowserSessionAccepted(page, cred, timeoutMs);
  const drawer = communityPublishDrawerShell(page);
  await expect(drawer).toBeVisible({ timeout: timeoutMs });
  return drawer;
}

/** `apiLoginReturnCredentials` 成功返回值（token 必填）。 */
export type CommunityPublishDrawerLoginCred = {
  token: string;
  userId?: string;
};

/**
 * Feed 上点发布入口或回退 `?publish=1` 打开抽屉，并等到 capabilities 200（与 minio 证据 spec 同源）。
 */
export async function openCommunityPublishDrawer(
  page: Page,
  cred: CommunityPublishDrawerLoginCred,
  timeoutMs = 180_000,
): Promise<Locator> {
  const drawer = communityPublishDrawerShell(page);
  const publishSel =
    '[data-testid="community-feed-publish-entry"],[data-testid="community-feed-publish-fab"]';

  const feedOk = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      r.status() === 200 &&
      (r.url().includes("/api/v1/community/feed") || r.url().includes("/api/v1/community/me/following")),
    { timeout: timeoutMs },
  );

  await gotoWithBearerSession(page, "/community", cred);
  await page.waitForSelector('[data-tt-community-feed-page="1"]', { timeout: timeoutMs });
  await feedOk;
  await ensureCommunityBrowserSessionAccepted(page, cred, timeoutMs);

  let openedViaControl = false;
  try {
    await page.waitForSelector(publishSel, { state: "attached", timeout: 45_000 });
    const feedRoot = page.locator('[data-tt-community-feed-page="1"]');
    const pubEntryInFeed = feedRoot.getByTestId("community-feed-publish-entry").first();
    const pubEntryGlobal = page.getByTestId("community-feed-publish-entry").first();
    const pubFab = page.getByTestId("community-feed-publish-fab").first();
    const nEntryFeed = await pubEntryInFeed.count();
    const nEntryAny = await pubEntryGlobal.count();
    const nFab = await pubFab.count();
    if (nEntryFeed > 0 || nEntryAny > 0 || nFab > 0) {
      if (nEntryFeed > 0) await pubEntryInFeed.click({ force: true });
      else if (nEntryAny > 0) await pubEntryGlobal.click({ force: true });
      else await pubFab.click({ force: true });
      openedViaControl = true;
      await expect(drawer).toBeVisible({ timeout: timeoutMs });
    }
  } catch {
    openedViaControl = false;
  }

  if (!openedViaControl) {
    return openCommunityPublishDrawerViaQuery(page, cred, timeoutMs);
  }

  return drawer;
}
