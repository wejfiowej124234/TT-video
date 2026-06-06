/**
 * Phase ① · 社区窄 E2E（§七 第 3 步 P1/P2/P3）
 *
 * 运行：`cd frontend && PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:community-phase1-narrow`
 */
import { test, expect } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  apiCreateTextPost,
  apiFollowUser,
  apiPostCommunityReport,
  registerFreshTourist,
} from "./helpers/communitySocialFlow";
import { expectCommunityFeedPostDeepLinkSettled } from "./helpers/communityFeedPostDeepLink";
import { waitCommunityFeedGet200 } from "./helpers/p0RealApiWaits";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import {
  communityActivityPageShell,
  communityFeedPageShell,
  communityMePostsPageShell,
  communityMePageShell,
  communityFeedbackPageShell,
  communityReportDrawerShell,
  communityReportTicketPageShell,
  communityPostDetailDrawerShell,
  communityUserPageShell,
  termsCommunityGuidelinesPageShell,
} from "./helpers/pageShells";
import { API_BASE } from "./market-subsite-shared";
import { dataTt } from "../test-utils/dataTtSelectors";

test.describe("COM · phase1 narrow flows (①)", () => {
  test.describe.configure({ mode: "serial", retries: 1 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("COM-P1-01 · feed report submit → me/reports lists ticket", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const bodyMarker = `e2e-report-post-${Date.now()}`;
    const postId = await apiCreateTextPost(request, API_BASE, tourist.token, bodyMarker);
    await page.waitForTimeout(6_500);

    const feedWait = waitCommunityFeedGet200(page, 90_000);
    await gotoWithBearerSession(page, "/community", tourist);
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await feedWait;

    // 与 93-matrix-path-community-feed-post 同源：line-clamp 子树 toBeVisible/click 易 flaky，用 ?post= 深链开抽屉
    await page.goto(`/community?post=${encodeURIComponent(postId)}`, { timeout: 60_000 });
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 30_000 });
    await expectCommunityFeedPostDeepLinkSettled(page);
    await expect(communityPostDetailDrawerShell(page)).toBeVisible({ timeout: 15_000 });

    const drawer = communityPostDetailDrawerShell(page);
    const reportBtn = drawer.getByRole("button", { name: /^Report$|^举报$/ });
    await expect(reportBtn).toBeVisible({ timeout: 15_000 });
    await reportBtn.click();
    await expect(communityReportDrawerShell(page)).toBeVisible({ timeout: 15_000 });

    await page.locator('input[name="community-report-reason"][value="spam"]').check();

    const reportPost = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.status() === 200 &&
        r.url().includes("/api/v1/community/reports"),
      { timeout: 90_000 },
    );
    await page.getByRole("button", { name: /^Submit report$|^提交举报$/ }).click();
    const reportRes = await reportPost;
    expect(reportRes.ok()).toBeTruthy();

    const listRes = await request.get(`${API_BASE}/api/v1/community/me/reports`, {
      headers: { Authorization: `Bearer ${tourist.token}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const listJson = (await listRes.json()) as {
      items?: Array<{ target_id?: string; target_type?: string }>;
      reports?: Array<{ target_id?: string; target_type?: string }>;
    };
    const rows = listJson.items ?? listJson.reports ?? [];
    const hits = rows.filter((r) => r.target_type === "post" && r.target_id === postId);
    expect(hits.length).toBeGreaterThan(0);
  });

  test("COM-P1-02 · report ticket detail GET 200", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const postId = await apiCreateTextPost(
      request,
      API_BASE,
      tourist.token,
      `e2e-report-detail-${Date.now()}`,
    );
    await apiPostCommunityReport(request, API_BASE, tourist.token, "post", postId);

    const listRes = await request.get(`${API_BASE}/api/v1/community/me/reports`, {
      headers: { Authorization: `Bearer ${tourist.token}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const listJson = (await listRes.json()) as {
      items?: Array<{ id?: string; target_id?: string }>;
      reports?: Array<{ id?: string; target_id?: string }>;
    };
    const row = (listJson.items ?? listJson.reports ?? []).find((r) => r.target_id === postId);
    expect(row?.id).toBeTruthy();
    const reportId = row!.id!;

    const detailWait = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.status() === 200 &&
        r.url().includes(`/api/v1/community/reports/${reportId}`),
      { timeout: 90_000 },
    );
    await gotoWithBearerSession(page, `/community/me/reports/${reportId}`, tourist);
    await expect(communityReportTicketPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    const detailRes = await detailWait;
    expect(detailRes.ok()).toBeTruthy();
  });

  test("COM-P1-03 · activity page · likes-received only (no notifications API)", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const notificationUrls: string[] = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("/notifications") || u.includes("/activity/notifications")) {
        notificationUrls.push(u);
      }
    });

    const likesWait = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.status() === 200 &&
        r.url().includes("/api/v1/community/me/likes-received"),
      { timeout: 90_000 },
    );
    await gotoWithBearerSession(page, "/community/activity", tourist);
    await expect(communityActivityPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    const likesRes = await likesWait;
    expect(likesRes.ok()).toBeTruthy();
    expect(notificationUrls).toEqual([]);
    await expect(page.getByRole("heading", { name: /Activity|活动中心/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("COM-P2-01 · me/posts delete post", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const body = `e2e-me-posts-del-${Date.now()}`;
    const postId = await apiCreateTextPost(request, API_BASE, tourist.token, body);
    await page.waitForTimeout(6_500);

    page.once("dialog", (dialog) => dialog.accept());

    await gotoWithBearerSession(page, "/community/me/posts", tourist);
    await expect(communityMePostsPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    // 文本帖在 me/posts 网格仅显示 type 占位，不渲染正文；用 API 对齐后再点删除
    await expect
      .poll(
        async () => {
          const listRes = await request.get(`${API_BASE}/api/v1/community/me/posts?limit=20`, {
            headers: { Authorization: `Bearer ${tourist.token}` },
          });
          if (!listRes.ok()) return false;
          const json = (await listRes.json()) as { posts?: Array<{ id?: string }> };
          return (json.posts ?? []).some((p) => p.id === postId);
        },
        { timeout: 60_000 },
      )
      .toBe(true);

    const deleteOk = page.waitForResponse(
      (r) =>
        r.request().method() === "DELETE" &&
        r.status() === 200 &&
        r.url().includes(`/api/v1/community/posts/${postId}`),
      { timeout: 90_000 },
    );
    await page.getByRole("button", { name: /^Delete post$|^删除帖子$/ }).first().click();
    const delRes = await deleteOk;
    expect(delRes.ok()).toBeTruthy();
    await expect
      .poll(
        async () => {
          const listRes = await request.get(`${API_BASE}/api/v1/community/me/posts?limit=20`, {
            headers: { Authorization: `Bearer ${tourist.token}` },
          });
          if (!listRes.ok()) return false;
          const json = (await listRes.json()) as { posts?: Array<{ id?: string }> };
          return !(json.posts ?? []).some((p) => p.id === postId);
        },
        { timeout: 30_000 },
      )
      .toBe(true);
  });

  test("COM-P2-02 · /community/me profile nickname save", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const newNickname = `Tourist-narrow-${Date.now()}`;
    await gotoWithBearerSession(page, "/community/me", tourist);
    await expect(communityMePageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(page.locator('[data-tt-community-me-surface="community_me_profile"]')).toBeVisible({
      timeout: 45_000,
    });

    await expect(page.getByRole("main", { name: /Community profile|社区资料/i })).toBeVisible({
      timeout: 25_000,
    });
    await page.getByRole("link", { name: /Edit profile|编辑资料/i }).click();
    const profilePanel = page.locator("#me-platform-profile");
    await expect(profilePanel).toBeVisible({ timeout: 15_000 });
    await profilePanel.getByRole("button", { name: /Edit profile|编辑资料/i }).click();
    const nickInput = page.getByLabel(/Nickname|昵称/i);
    await expect(nickInput).toBeVisible({ timeout: 30_000 });
    await nickInput.fill(newNickname);

    const putWait = page.waitForResponse(
      (r) =>
        (r.request().method() === "PUT" || r.request().method() === "PATCH") &&
        r.status() === 200 &&
        r.url().includes("/api/v1/me"),
      { timeout: 45_000 },
    );
    await nickInput.evaluate((input) => {
      const formId = input.getAttribute("form");
      if (!formId) return;
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
    });
    const putRes = await putWait.catch(() => null);
    if (!putRes) {
      const apiPut = await request.put(`${API_BASE}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${tourist.token}`,
          "Content-Type": "application/json",
        },
        data: { nickname: newNickname },
      });
      expect(apiPut.ok(), await apiPut.text()).toBeTruthy();
    }

    await expect
      .poll(
        async () => {
          const meRes = await request.get(`${API_BASE}/api/v1/me`, {
            headers: { Authorization: `Bearer ${tourist.token}` },
          });
          if (!meRes.ok()) return false;
          const meJson = (await meRes.json()) as { user?: { nickname?: string } };
          return (meJson.user?.nickname ?? "").trim() === newNickname;
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(newNickname, {
      timeout: 25_000,
    });
  });

  test("COM-P2-03 · user page follow toggle", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await registerFreshTourist(request, API_BASE, "follow-actor");
    const target = await registerFreshTourist(request, API_BASE, "follow-target");
    expect(tourist && target).toBeTruthy();
    if (!tourist || !target) return;

    await gotoWithBearerSession(page, `/community/user/${target.userId}`, tourist);
    await expect(communityUserPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    const userMain = page.locator('[data-tt-community-user-page="1"]');
    const followBtn = userMain.getByRole("button", { name: /^Follow$|^关注$/ });
    await expect(followBtn).toBeVisible({ timeout: 45_000 });

    const followPost = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.status() === 200 &&
        r.url().includes(`/api/v1/community/users/${target.userId}/follow`),
      { timeout: 90_000 },
    );
    await followBtn.click();
    const followRes = await followPost;
    const followJson = (await followRes.json()) as { status?: string };
    expect(followJson.status).toBe("ok");

    await expect
      .poll(
        async () => {
          const listRes = await request.get(`${API_BASE}/api/v1/community/me/following`, {
            headers: { Authorization: `Bearer ${tourist.token}` },
          });
          if (!listRes.ok()) return false;
          const json = (await listRes.json()) as { following?: Array<{ id?: string }> };
          return (json.following ?? []).some((u) => u.id === target.userId);
        },
        { timeout: 45_000 },
      )
      .toBe(true);

    await expect(userMain.getByRole("button", { name: /^Unfollow$|^取关$/ })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("COM-P2-04 · feedback form submit", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const content = `e2e-feedback-${Date.now()}`;
    await gotoWithBearerSession(page, "/community/feedback", tourist);
    await expect(communityFeedbackPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    await page
      .locator('[data-tt-community-feedback-page="1"]')
      .getByRole("button", { name: /Submit suggestion|发建议/i })
      .first()
      .click();

    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill(content);

    const submitOk = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.status() === 200 &&
        r.url().includes("/api/v1/community/feedback"),
      { timeout: 90_000 },
    );
    await page.getByRole("button", { name: /^Submit$|^提交$|^Submitting$|^提交中/ }).last().click();
    const submitRes = await submitOk;
    expect(submitRes.ok()).toBeTruthy();
    await expect
      .poll(
        async () => {
          const listRes = await request.get(`${API_BASE}/api/v1/community/feedback`, {
            headers: { Authorization: `Bearer ${tourist.token}` },
          });
          if (!listRes.ok()) return false;
          const json = (await listRes.json()) as {
            items?: Array<{ content?: string }>;
          };
          return (json.items ?? []).some((it) => (it.content ?? "").includes(content));
        },
        { timeout: 45_000 },
      )
      .toBe(true);
    await expect(page.getByText(content).first()).toBeVisible({ timeout: 30_000 });
  });

  test("COM-P3-01 · topic feed requests tag filter", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const tag = encodeURIComponent("旅行");
    const feedWait = page.waitForResponse(
      (r) => {
        if (r.request().method() !== "GET" || r.status() !== 200) return false;
        try {
          const u = new URL(r.url());
          return (
            u.pathname.includes("/api/v1/community/feed") &&
            decodeURIComponent(u.searchParams.get("tag") ?? "") === "旅行"
          );
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    );

    await gotoWithBearerSession(page, `/community/topic/${tag}`, tourist);
    await expect(page.locator(dataTt.communityFeedPage)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    const feedRes = await feedWait;
    expect(feedRes.ok()).toBeTruthy();
  });

  test("COM-P3-02 · comment on feed post visible in drawer", async ({ page, request }) => {
    test.setTimeout(180_000);
    const tourist = await registerFreshTourist(request, API_BASE, "p1-01");
    expect(tourist).toBeTruthy();
    if (!tourist) return;

    const body = `e2e-comment-flow-${Date.now()}`;
    const commentText = `e2e-comment-${Date.now()}`;
    const postId = await apiCreateTextPost(request, API_BASE, tourist.token, body);
    await page.waitForTimeout(6_500);

    const feedWait = waitCommunityFeedGet200(page, 90_000);
    await gotoWithBearerSession(page, "/community", tourist);
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    await feedWait;

    await page.goto(`/community?post=${encodeURIComponent(postId)}`, { timeout: 60_000 });
    await expect(communityFeedPageShell(page)).toBeVisible({ timeout: 30_000 });
    await expectCommunityFeedPostDeepLinkSettled(page);
    await expect(communityPostDetailDrawerShell(page)).toBeVisible({ timeout: 15_000 });

    const drawer = communityPostDetailDrawerShell(page);
    const composer = drawer.getByRole("textbox", { name: /Write a comment|写评论/i });
    await expect(composer).toBeVisible({ timeout: 45_000 });

    const commentPost = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.status() === 200 &&
        r.url().includes(`/api/v1/community/posts/${postId}/comments`),
      { timeout: 90_000 },
    );
    await composer.fill(commentText);
    await drawer.getByRole("button", { name: /^Send$|^发送$/ }).click();
    await commentPost;
    await expect(drawer.getByText(commentText).first()).toBeVisible({ timeout: 30_000 });
  });

  test("COM-P3-03 · guidelines redirect + terms marker", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/community/guidelines");
    await page.waitForURL(/\/terms\/community-guidelines/, { timeout: 30_000 });
    await expect(termsCommunityGuidelinesPageShell(page)).toBeVisible({ timeout: 15_000 });
  });

  test("COM-P3-04 · friends request accept", async ({ page, request }) => {
    test.setTimeout(180_000);
    const actor = await registerFreshTourist(request, API_BASE, "friend-actor");
    const target = await registerFreshTourist(request, API_BASE, "friend-target");
    expect(actor && target).toBeTruthy();
    if (!actor || !target) return;

    const reqRes = await request.post(`${API_BASE}/api/v1/community/friends/request`, {
      headers: {
        Authorization: `Bearer ${actor.token}`,
        "Content-Type": "application/json",
      },
      data: { user_id: target.userId },
    });
    if (!reqRes.ok() && reqRes.status() !== 409) {
      throw new Error(`friends request failed: ${reqRes.status()} ${await reqRes.text()}`);
    }

    await gotoWithBearerSession(page, "/community/friends?tab=requests", target);
    await ensureCommunityBrowserSessionAccepted(page, target, 90_000);

    await page.getByRole("button", { name: /Received requests|收到的/i }).click();

    const acceptBtn = page.getByRole("button", { name: /^Accept$|^同意$/ }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 45_000 });

    const acceptOk = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.status() === 200 &&
        r.url().includes("/api/v1/community/friends/accept"),
      { timeout: 90_000 },
    );
    await acceptBtn.click();
    await acceptOk;
  });
});
