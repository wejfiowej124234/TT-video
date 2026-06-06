import { expect, type Locator, type Page } from "@playwright/test";

import type { BearerSessionCredentials } from "./apiSession";
import { ensureCommunityBrowserSessionAccepted } from "./apiSession";
import { expectCommunityFeedPostDeepLinkSettled } from "./communityFeedPostDeepLink";
import {
  communityFeedPageShell,
  communityPostDetailDrawerShell,
  communityPostDetailShowcaseShell,
} from "./pageShells";
import { waitCommunityFeedGet200 } from "./p0RealApiWaits";
import { gotoSmoke } from "./smoke-nav";

/** ① curated demo · 与 `lib/communityShowcase.ts` 同源 */
export const SHOWCASE_POST_A = "tt-showcase-post-001";
export const SHOWCASE_POST_B = "tt-showcase-post-007";

const stabilityMode =
  process.env.PLAYWRIGHT_E2E_STABILITY === "1" || process.env.CI === "true";

/** 稳定性门禁下拉长超时（与 `community-me-data-state.spec.ts` 同源） */
export const showcaseSpecTimeoutMs = stabilityMode ? 180_000 : 120_000;
export const showcaseDrawerTimeoutMs = stabilityMode ? 45_000 : 30_000;
export const showcaseFeedWaitMs = stabilityMode ? 90_000 : 60_000;
export const showcaseAuthWaitMs = stabilityMode ? 90_000 : 60_000;

const COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_EN =
  "This post doesn\u2019t exist, was removed, or isn\u2019t visible right now (for example, the author limited who can see it).";
const COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_ZH =
  "该帖子不存在、已删除，或暂时不可见（例如作者限制了可见范围）。";

/** Next dev 用 `127.0.0.1` 打开页面会拦截 `/_next/*`（cross-host）；稳定性路径须 `localhost`（见 `run-e2e-default.mjs`）。 */
export function assertShowcaseE2eHostPolicy() {
  const base = (process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3012").trim();
  try {
    const host = new URL(base).hostname;
    if (host === "127.0.0.1") {
      console.warn(
        "[showcase-e2e] PLAYWRIGHT_BASE_URL uses 127.0.0.1 — prefer localhost:3012 or PLAYWRIGHT_E2E_STABILITY=1 to avoid Next dev /_next cross-host flakes",
      );
    }
  } catch {
    /* ignore */
  }
}

export async function expectNoCommunityPageError(page: Page) {
  await expect(
    page.getByRole("heading", { name: /页面加载异常|Page load error|Something went wrong/i }),
  ).toHaveCount(0);
}

/** 空 Feed + showcase 帖 GET/评论 mock；须在首次 `goto` 前安装。 */
export async function installShowcaseFeedMocks(page: Page) {
  await page.route("**/api/v1/community/posts/tt-showcase-post-*", async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    if (method === "GET" && !url.includes("/comments")) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: "not_found" }),
      });
      return;
    }
    if (method === "GET" && url.includes("/comments")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok", comments: [], next_cursor: null }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/v1/community/feed**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", posts: [], next_cursor: null }),
    });
  });
}

/** Feed 可能因 React Query 缓存不再请求；深链 settled 即可继续。 */
export async function waitForCommunityFeedGet200Soft(page: Page, timeoutMs: number): Promise<void> {
  await waitCommunityFeedGet200(page, timeoutMs).catch(() => undefined);
}

async function expectShowcaseDeepLinkNotUnavailable(page: Page) {
  const shell = communityFeedPageShell(page);
  await expect(shell.getByText(COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_EN)).toHaveCount(0);
  await expect(shell.getByText(COMMUNITY_POST_DEEP_LINK_UNAVAILABLE_ZH)).toHaveCount(0);
}

/** `?post=tt-showcase-post-*` → 抽屉展示 curated 帖（不依赖 Feed 首屏 hydrate 时序）。 */
export async function openShowcasePostDeepLink(page: Page, postId: string): Promise<Locator> {
  assertShowcaseE2eHostPolicy();

  const feedWait = waitForCommunityFeedGet200Soft(page, showcaseFeedWaitMs);
  await gotoSmoke(page, `/community?post=${encodeURIComponent(postId)}`, {
    timeout: showcaseSpecTimeoutMs,
  });

  await expect(communityFeedPageShell(page)).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
  await expectNoCommunityPageError(page);
  await feedWait;
  await expectCommunityFeedPostDeepLinkSettled(page);
  await expectShowcaseDeepLinkNotUnavailable(page);

  const drawer = communityPostDetailDrawerShell(page);
  await expect
    .poll(
      async () => {
        if (!(await drawer.isVisible().catch(() => false))) return null;
        const id = await drawer.getAttribute("data-post-id");
        if (id !== postId) return null;
        if ((await drawer.getAttribute("data-tt-community-post-detail-showcase")) !== "1") {
          return null;
        }
        return true;
      },
      { timeout: showcaseDrawerTimeoutMs, intervals: [100, 250, 500, 1000] },
    )
    .toBe(true);

  return drawer;
}

export async function expectShowcaseDrawerMarkers(page: Page, drawer: Locator) {
  await expect(communityPostDetailShowcaseShell(page)).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
  await expect(
    drawer.getByRole("note").filter({ hasText: /演示内容|Demo content/i }),
  ).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
  await expect(drawer.getByText(/祇园|Gion/i)).toBeVisible();
}

export async function expectShowcaseImageCounter(drawer: Locator, text: string | RegExp) {
  const counter = drawer.getByText(/\d+ \/ \d+/);
  await expect(counter.first()).toContainText(text, { timeout: showcaseDrawerTimeoutMs });
}

/** 登录态须等 `authPending` 结束后再点 Like（否则按钮长期 disabled）。 */
export async function expectShowcaseDrawerLikeReady(
  page: Page,
  drawer: Locator,
  session: BearerSessionCredentials,
): Promise<Locator> {
  await ensureCommunityBrowserSessionAccepted(page, session, showcaseAuthWaitMs);
  const likeBtn = drawer.getByRole("button", { name: /^Like$|^点赞$/ }).first();
  await expect(likeBtn).toBeVisible({ timeout: showcaseDrawerTimeoutMs });
  await expect(likeBtn).toBeEnabled({ timeout: showcaseAuthWaitMs });
  return likeBtn;
}
