/**
 * 社区烟雾：`/community/*` 与相关深链自 **`smoke.spec.ts`** 拆分（**TT-L4-SMOKE-SLOWFILE-PERF-001** · 降单文件时长；断言与 `gotoSmoke` 不变）。
 * 见 `e2e/helpers/smoke-nav.ts`（默认 **`page.goto` / `load`**）。
 */
import { test, expect } from "@playwright/test";
import { gotoSmoke } from "./helpers/smoke-nav";

test("社区 Feed 可访问", async ({ page }) => {
  await gotoSmoke(page, "/community");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible();
});

test("社区发现页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/explore");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Explore|发现/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Explore|发现/i })).toBeVisible();
});

test("社区活动中心可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/activity");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Activity|活动中心/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Activity|活动中心/i })).toBeVisible();
});

test("TT 社区介绍页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/tt");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /TT Community|TT 社区/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible();
});

test("社区话题聚合页可访问", async ({ page }) => {
  await gotoSmoke(page, `/community/topic/${encodeURIComponent("旅行")}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "#旅行" })).toBeVisible();
});

test("社区好友页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/friends");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Friends|好友/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Friends|好友/i })).toBeVisible();
});

test("社区消息页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/messages");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Messages|消息/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Messages|消息/i })).toBeVisible();
});

/** 53-S7 / 31：从订单详情「前往聊天」带 ?orderId= 时列表页顶部展示只读订单摘要区（无 API 时亦为加载/错误/无详情之一） */
test("社区消息页带 orderId 展示订单摘要区（53-S7）", async ({ page }) => {
  const oid = "00000000-0000-4000-8000-000000000099";
  await gotoSmoke(page, `/community/messages?orderId=${encodeURIComponent(oid)}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Messages|消息/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /本订单摘要|Order summary/i }).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page
      .getByText(/仅供会话内对照|for reference in this chat only/i)
      .first(),
  ).toBeVisible({ timeout: 15_000 });
});

test("社区反馈页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/feedback");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Contact us|与官方沟通/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Contact us|与官方沟通/i })).toBeVisible();
});

test("社区我的页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/me");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Me|我/i })).toBeVisible();
});

test("社区我的收藏页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/me/collects");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My collects|我的收藏/i })).toBeVisible();
});

test("社区我的帖子页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/me/posts");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My posts|我的帖子/i })).toBeVisible();
});

test("社区我的举报列表页可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/me/reports");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My reports|我的举报/i })).toBeVisible();
});

test("社区 Feed 带 post 查询可访问", async ({ page }) => {
  await gotoSmoke(page, "/community?post=00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /TT Community|TT\s*社区/i })).toBeVisible({ timeout: 20_000 });
});

test("社区用户主页可访问（占位 UUID）", async ({ page }) => {
  const profileId = "00000000-0000-4000-8000-000000000001";
  await gotoSmoke(page, `/community/user/${profileId}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Member profile|用户主页/i })).toBeVisible({
    timeout: 35_000,
  });
  await expect(page.getByText(new RegExp(`ID:\\s*${profileId}`))).toBeVisible({ timeout: 40_000 });
});

test("社区用户主页非法 id 可访问", async ({ page }) => {
  await gotoSmoke(page, "/community/user/not-a-uuid");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /User not found|用户不存在/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /User not found|用户不存在/i })).toBeVisible();
});

test("社区私信会话页可访问（占位会话 id）", async ({ page }) => {
  const convId = "00000000-0000-4000-8000-000000000001";
  await gotoSmoke(page, `/community/messages/${convId}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Direct message thread|私信会话/i })).toBeVisible({ timeout: 20_000 });
  // Header back control is a Link (navigate to /community/messages), not a <button>.
  await expect(page.getByRole("link", { name: /Back|返回/i })).toBeVisible();
});

/** 53-S7：会话详情 URL 保留 ?orderId=（合法 UUID）时在消息区上方展示只读订单摘要卡片 */
test("社区私信会话页带 orderId 展示订单摘要区（53-S7）", async ({ page }) => {
  const convId = "00000000-0000-4000-8000-000000000088";
  const oid = "00000000-0000-4000-8000-000000000099";
  await gotoSmoke(page, `/community/messages/${convId}?orderId=${encodeURIComponent(oid)}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Direct message thread|私信会话/i })).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: /本订单摘要|Order summary/i }).first(),
  ).toBeVisible({ timeout: 15_000 });
});

test("社区举报工单详情可访问（未登录提示）", async ({ page }) => {
  test.setTimeout(60_000);
  const ticketId = "00000000-0000-4000-8000-000000000001";
  await gotoSmoke(page, `/community/me/reports/${ticketId}`);
  await page.waitForURL(`**/community/me/reports/${ticketId}`, { timeout: 30_000 });
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Report ticket|举报工单/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Sign in to view|请先登录/i)).toBeVisible({ timeout: 25_000 });
});
