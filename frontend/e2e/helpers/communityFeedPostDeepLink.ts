import { expect, type Locator, type Page } from "@playwright/test";

import { communityFeedPageShell, communityPostDetailDrawerShell } from "./pageShells";

/**
 * **`gotoSmoke(/community?post=…)`** 或 **`gotoSmoke(/community/post/:id)`**（**B-055**）之后：
 * **`useCommunityFeedPostDeepLink`** 会 **`replaceState` 剥 `?post=`**，**勿**对地址栏做 **`waitForURL(post=)`**。
 *
 * **不可用文案真源**：`frontend/locales/en.ts` / **`zh.ts`** 同键 **`community_postDeepLink_notFoundOrHidden`**
 *（与 **`CommunityFeedMainPreHeroAlerts`** 渲染同源；键旁 **`//`** 注释与本文件互指）。**改翻译时须同步**下方字面量（或改本 helper 并跑社区深链 E2E）。
 */
const COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_EN =
  "This post doesn\u2019t exist, was removed, or isn\u2019t visible right now (for example, the author limited who can see it).";

/** 与 **`zh.ts`** **`community_postDeepLink_notFoundOrHidden`** 对拍。 */
const COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_ZH =
  "该帖子不存在、已删除，或暂时不可见（例如作者限制了可见范围）。";

export async function expectCommunityFeedPostDeepLinkSettled(
  page: Page,
  feedShell?: Locator,
): Promise<void> {
  const shell = feedShell ?? communityFeedPageShell(page);
  const postDrawer = communityPostDetailDrawerShell(page);
  await expect
    .poll(async () => {
      if (await postDrawer.isVisible().catch(() => false)) return true;
      if (await shell.getByText(COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_EN).isVisible().catch(() => false)) {
        return true;
      }
      if (await shell.getByText(COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_ZH).isVisible().catch(() => false)) {
        return true;
      }
      return false;
    }, { timeout: 90_000 })
    .toBe(true);
}
