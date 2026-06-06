/**
 * G-02 · 社区好友 / 私信业务流 E2E（Phase ①）
 *
 * 运行：`cd frontend && npm run e2e:community-social-flow`
 */
import { test, expect } from "@playwright/test";

import {
  ensureCommunityBrowserSessionAccepted,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import {
  apiEnsureConversation,
  apiFollowUser,
  resolveSeedUserId,
} from "./helpers/communitySocialFlow";
import { waitCommunityMeFollowingGet200 } from "./helpers/p0RealApiWaits";
import { skipIfApiDown } from "./helpers/skipIfApiDown";
import { communityFriendsPageShell, communityMessagesThreadPageShell } from "./helpers/pageShells";
import { API_BASE } from "./market-subsite-shared";

const GUIDE_NICKNAME_RE = /测试向导|Guide/i;

test.describe("G-02 · community friends & messages flow (①)", () => {
  test.describe.configure({ mode: "serial", retries: 1 });

  test.beforeEach(async ({ request }) => {
    await skipIfApiDown(request);
    await seedTestAccountsAndReleaseGuideSlot(request, API_BASE);
  });

  test("COM-G02-01 · follow guide → friends following tab", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    const guide = await resolveSeedUserId(request, API_BASE, "guide@test.com");
    expect(tourist).toBeTruthy();
    expect(guide).toBeTruthy();
    if (!tourist || !guide) return;

    await apiFollowUser(request, API_BASE, tourist.token, guide.userId);

    const followingWait = waitCommunityMeFollowingGet200(page, 90_000);
    await gotoWithBearerSession(page, "/community/friends?tab=following", tourist);
    await expect(communityFriendsPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);
    const followingRes = await followingWait;
    expect(followingRes.ok()).toBeTruthy();
    const followingJson = (await followingRes.json()) as {
      following?: Array<{ id?: string; nickname?: string }>;
    };
    const ids = (followingJson.following ?? []).map((u) => u.id);
    expect(ids).toContain(guide.userId);

    const guideProfileLink = page.getByRole("link", { name: GUIDE_NICKNAME_RE }).first();
    await expect(guideProfileLink).toBeVisible({ timeout: 30_000 });
    await expect(guideProfileLink).toHaveAttribute("href", `/community/user/${guide.userId}`);
  });

  test("COM-G02-02 · ensure conversation → send DM → persists", async ({ page, request }) => {
    test.setTimeout(120_000);
    const tourist = await resolveSeedUserId(request, API_BASE, "tourist@test.com");
    const guide = await resolveSeedUserId(request, API_BASE, "guide@test.com");
    expect(tourist).toBeTruthy();
    expect(guide).toBeTruthy();
    if (!tourist || !guide) return;

    const convId = await apiEnsureConversation(request, API_BASE, tourist.token, guide.userId);
    const bodyText = `g02-dm-${Date.now()}`;

    await gotoWithBearerSession(page, `/community/messages/${convId}`, tourist);
    await expect(communityMessagesThreadPageShell(page)).toBeVisible({ timeout: 30_000 });
    await ensureCommunityBrowserSessionAccepted(page, tourist, 90_000);

    const composer = page.getByPlaceholder(/Type a message|输入消息/i);
    await expect(composer).toBeEnabled({ timeout: 30_000 });

    const sendOk = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().includes(`/api/v1/community/conversations/${convId}/messages`) &&
        r.status() === 200,
      { timeout: 90_000 },
    );

    await composer.fill(bodyText);
    await page.getByRole("button", { name: /^Send$|^发送$/ }).click();
    const postRes = await sendOk;
    expect(postRes.ok()).toBeTruthy();

    await expect(page.getByText(bodyText).first()).toBeVisible({ timeout: 15_000 });

    const listRes = await request.get(
      `${API_BASE}/api/v1/community/conversations/${encodeURIComponent(convId)}/messages`,
      { headers: { Authorization: `Bearer ${tourist.token}` } },
    );
    expect(listRes.ok(), await listRes.text()).toBeTruthy();
    const listJson = (await listRes.json()) as { messages?: Array<{ body?: string }> };
    const bodies = (listJson.messages ?? []).map((m) => m.body ?? "");
    expect(bodies.some((b) => b.includes(bodyText))).toBeTruthy();
  });
});
