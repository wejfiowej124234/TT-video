/**
 * 烟雾测试：首页、DID 榜、社区 Feed/发现可访问（63 / 31 E2E 占位扩展）
 * 含治理 Target 披露（07 §5.2A）、/network→/traveltrust（85·04）、向导工作台 /guide（§5.0）、Admin 首页卡片与子页全量可达（含 `[id]` 占位详情、DSAR 事件轴/登记更新子路径；5.1、5.8、Wave、100、120、160、500、5.2A、110、200、07 §5.3B·§5.7、§5.6C·70）、社区消息与私信线程订单摘要（53-S7）。
 * 本地需先 npm run dev，或 CI 中由 playwright.config 启动 webServer
 */
import { test, expect } from "@playwright/test";
import {
  apiLoginReturnCredentials,
  defaultApiBase,
  gotoWithBearerSession,
  seedTestAccountsAndReleaseGuideSlot,
} from "./helpers/apiSession";
import { communityMeMainAccessibleNameRe } from "./helpers/communityMeLegacyRedirects";

test("首页可访问", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(
    page.getByRole("main", { name: /定制旅行|Custom travel|选目的地|Pick a destination/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /发现|Discover|市场/i }).first()).toBeVisible();
});

test("DID 排行榜可访问", async ({ page }) => {
  await page.goto("/did-rank");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Ranking|排行榜/i })).toBeVisible();
  await expect(page.getByText(/DID|排行榜|Prize|奖金池/i).first()).toBeVisible();
});

test("社区 Feed 可访问", async ({ page }) => {
  await page.goto("/community");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible();
});

test("社区发现页可访问", async ({ page }) => {
  await page.goto("/community/explore");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Explore|发现/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Explore|发现/i })).toBeVisible();
});

test("社区活动中心可访问", async ({ page }) => {
  await page.goto("/community/activity");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Activity|活动中心/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Activity|活动中心/i })).toBeVisible();
});

test("TT 社区介绍页可访问", async ({ page }) => {
  await page.goto("/community/tt");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /TT Community|TT 社区/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible();
});

test("社区话题聚合页可访问", async ({ page }) => {
  await page.goto(`/community/topic/${encodeURIComponent("旅行")}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "#旅行" })).toBeVisible();
});

test("社区好友页可访问", async ({ page }) => {
  await page.goto("/community/friends");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Friends|好友/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Friends|好友/i })).toBeVisible();
});

test("社区消息页可访问", async ({ page }) => {
  await page.goto("/community/messages");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Messages|消息/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Messages|消息/i })).toBeVisible();
});

/** 53-S7 / 31：从订单详情「前往聊天」带 ?orderId= 时列表页顶部展示只读订单摘要区（无 API 时亦为加载/错误/无详情之一） */
test("社区消息页带 orderId 展示订单摘要区（53-S7）", async ({ page }) => {
  const oid = "00000000-0000-4000-8000-000000000099";
  await page.goto(`/community/messages?orderId=${encodeURIComponent(oid)}`);
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
  await page.goto("/community/feedback");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Contact us|与官方沟通/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Contact us|与官方沟通/i })).toBeVisible();
});

test("社区资料页可访问", async ({ page }) => {
  await page.goto("/community/me");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: communityMeMainAccessibleNameRe })).toBeVisible();
});

test("社区我的收藏页可访问", async ({ page }) => {
  await page.goto("/community/me/collects");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My collects|我的收藏/i })).toBeVisible();
});

test("社区我的帖子页可访问", async ({ page }) => {
  await page.goto("/community/me/posts");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My posts|我的帖子/i })).toBeVisible();
});

test("社区我的举报列表页可访问", async ({ page }) => {
  await page.goto("/community/me/reports");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /My reports|我的举报/i })).toBeVisible();
});

test("社区规范页可访问", async ({ page }) => {
  await page.goto("/terms/community-guidelines");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Community guidelines|社区规范/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Community guidelines|社区规范/i })).toBeVisible();
});

test("服务条款页可访问", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Terms of Service|服务条款/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Terms of Service|服务条款/i })).toBeVisible();
});

test("隐私政策页可访问", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Privacy Policy|隐私政策/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Privacy Policy|隐私政策/i })).toBeVisible();
});

test("帮助中心可访问", async ({ page }) => {
  await page.goto("/help");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Help|帮助中心/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Help|帮助中心/i })).toBeVisible();
});

test("登录页可访问", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Login|登录/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Login|登录/i })).toBeVisible();
});

test("注册入口页可访问", async ({ page }) => {
  await page.goto("/auth/register");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Register|注册/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Register|注册/i })).toBeVisible();
});

test("自由市场页可访问", async ({ page }) => {
  await page.goto("/market");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Market|自由市场/i })).toBeVisible();
});

test("发现页重定向至自由市场", async ({ page }) => {
  await page.goto("/discover");
  await page.waitForURL("**/market", { timeout: 15_000 });
  await expect(page.getByRole("main", { name: /Market|自由市场/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Market|自由市场/i })).toBeVisible();
});

test("向导列表页可访问", async ({ page }) => {
  await page.goto("/guides");
  await expect(page.getByRole("main", { name: /Guides|向导列表/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Guides|向导列表/i })).toBeVisible({ timeout: 20_000 });
});

test("我的页可访问（未登录回登录；已登录进多重身份 Hub 或社区资料）", async ({ page }) => {
  await page.goto("/me");
  await page.waitForURL(
    (url) =>
      url.pathname === "/me/identities" ||
      url.pathname === "/community/me" ||
      url.pathname.startsWith("/auth/login"),
    { timeout: 15_000 },
  );
  const path = new URL(page.url()).pathname;
  if (path.startsWith("/auth/login")) {
    await expect(page.getByRole("main", { name: /Login|登录/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Login|登录/i })).toBeVisible();
  } else if (path === "/me/identities") {
    await expect(page.getByRole("heading", { level: 1, name: /多重身份|Multiple roles/i })).toBeVisible();
  } else {
    await expect(page.getByRole("main", { name: /Community profile|社区资料/i })).toBeVisible();
  }
});

test("我的订单页可访问（未登录回登录或已登录留订单列表）", async ({ page }) => {
  await page.goto("/orders");
  await page.waitForURL(
    (url) => url.pathname === "/orders" || url.pathname.startsWith("/auth/login"),
    { timeout: 15_000 },
  );
  const path = new URL(page.url()).pathname;
  if (path.startsWith("/auth/login")) {
    await expect(page.getByRole("main", { name: /Login|登录/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Login|登录/i })).toBeVisible();
  } else {
    await expect(page.getByRole("main", { name: /My orders|我的订单/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /My orders|我的订单/i })).toBeVisible({ timeout: 20_000 });
  }
});

test("支付与托管页可访问", async ({ page }) => {
  await page.goto("/pay");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Pay & escrow|支付与托管/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Pay & escrow|支付与托管/i })).toBeVisible();
});

test("新建行程页可访问", async ({ page }) => {
  await page.goto("/itinerary/new");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Generate itinerary|行程生成/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Generate itinerary|行程生成/i })).toBeVisible();
});

test("创建订单页可访问", async ({ page }) => {
  await page.goto("/orders/new");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Create order|创建订单/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Create order|创建订单/i })).toBeVisible();
});

test("争议列表页可访问", async ({ page }) => {
  await page.goto("/disputes");
  await expect(page.getByRole("main", { name: /Disputes|争议列表/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Disputes|争议列表/i })).toBeVisible({ timeout: 20_000 });
});

/** 07 §5.2A / 13-1：`GovernanceTargetNotice` 默认 zh；en 构建含 placeholders 等词 */
const GOV_TARGET_NOTICE = /文档镜像|API 占位|placeholders|documentation mirrors|Protocol parameters|协议参数/i;

test("治理页可访问", async ({ page }) => {
  await page.goto("/governance");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Governance|治理/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Governance|治理/i })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("向导质押页可访问", async ({ page }) => {
  await page.goto("/staking");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Guide staking|向导质押/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Guide staking|向导质押/i })).toBeVisible();
});

test("社区 Feed 带 post 查询可访问", async ({ page }) => {
  await page.goto("/community?post=00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /TT Community|TT\s*社区/i })).toBeVisible({ timeout: 20_000 });
});

test("治理提案页可访问", async ({ page }) => {
  await page.goto("/governance/proposals");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Proposals|提案/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Proposals|提案/i })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("治理提案详情页可访问（B-072 种子 id）", async ({ page }) => {
  await page.goto("/governance/proposals/00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Proposal detail|提案详情/i })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("治理投票委托页可访问（B-073）", async ({ page }) => {
  await page.goto("/governance/delegate");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Vote delegation|投票委托/i })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("治理参数页可访问", async ({ page }) => {
  await page.goto("/governance/params");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Parameters|参数/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Parameters|参数/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /Parameter reconcile|参数对拍/i }),
  ).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("治理费用路由页可访问", async ({ page }) => {
  await page.goto("/governance/fee-routes");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Fee routes|费用路由/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Fee routes|费用路由/i })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("治理国家桶转出页可访问（vault-forwards）", async ({ page }) => {
  await page.goto("/governance/vault-forwards");
  await expect(page.locator("body")).toBeVisible();
  await expect(
    page.getByRole("main", { name: /Vault forwards|国家桶转出/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /Vault forwards|国家桶转出/i }),
  ).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: GOV_TARGET_NOTICE }).first()).toBeVisible();
});

test("TravelTrust 网络落地页可访问", async ({ page }) => {
  await page.goto("/traveltrust");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /TravelTrust Network|TravelTrust 网络/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /TravelTrust Network|TravelTrust 网络/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /FAQ|常见问题/i })).toBeVisible();
  await expect(page.locator("#faq details").first()).toBeVisible();
  await expect(page.locator("#live-network")).toBeVisible();
  await expect(page.locator("#live-stats")).toBeVisible();
  await expect(page.locator("#global-map")).toBeVisible();
  await expect(page.locator("#allocation")).toBeVisible();
  /** 85 §三 IA：章节锚点导航含首屏 / 视频 / 痛点 / 方案（07 §5.3A） */
  await expect(
    page.getByRole("navigation", { name: /On-page section navigation|本页章节导航/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /^Top$|^首屏$/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^Video$|^视频$/i }).first()).toBeVisible();
  const problemLink = page.getByRole("link", { name: /^Problem$|^痛点$/i }).first();
  await expect(problemLink).toBeVisible();
  await expect(problemLink).toHaveAttribute("href", "#problem");
  const solutionLink = page.getByRole("link", { name: /^Solution$|^方案$/i }).first();
  await expect(solutionLink).toBeVisible();
  await expect(solutionLink).toHaveAttribute("href", "#solution");
});

test("/network 别名重定向至 TravelTrust 落地页（85 / 04 §3.4）", async ({ page }) => {
  await page.goto("/network");
  await page.waitForURL("**/traveltrust", { timeout: 15_000 });
  await expect(page.getByRole("main", { name: /TravelTrust Network|TravelTrust 网络/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /TravelTrust Network|TravelTrust 网络/i })).toBeVisible();
});

test("托管详情页可访问（占位订单 UUID）", async ({ page }) => {
  await page.goto("/escrow/00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Order details|订单详情/i })).toBeVisible({ timeout: 25_000 });
});

test("行程评分页可访问（占位订单 UUID）", async ({ page }) => {
  await page.goto("/escrow/00000000-0000-4000-8000-000000000001/rate");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Trip rating|行程评分/i })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("heading", { level: 1, name: /Trip rating|行程评分|Load failed|加载失败/i })).toBeVisible({
    timeout: 25_000,
  });
});

test("向导注册页可访问", async ({ page }) => {
  await page.goto("/guide/register");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Become a Guide|成为向导/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Become a Guide|成为向导/i })).toBeVisible();
});

test("向导工作台页可访问（07 §5.0）", async ({ page, request }) => {
  test.setTimeout(120_000);
  const apiBase = defaultApiBase();
  const health = await request.get(`${apiBase}/health`).catch(() => null);
  if (!health?.ok()) {
    test.skip(true, `API 不可达，跳过向导台烟雾：${apiBase}/health`);
    return;
  }
  await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  const creds = await apiLoginReturnCredentials(request, apiBase, "guide@test.com", "Test123!");
  if (!creds?.token) {
    test.skip(true, "guide@test 登录无 token（需 SEED_TEST_ACCOUNTS 与 API）");
    return;
  }
  await gotoWithBearerSession(page, "/guide", creds);
  await page.waitForURL("**/guide", { timeout: 60_000 });
  await expect(page.locator("body")).toBeVisible();
  const guideMain = page.getByRole("main", { name: /Guide workspace|向导工作台/i });
  await expect(guideMain).toBeVisible({ timeout: 60_000 });
  await expect(
    guideMain.locator("header").first().getByRole("heading", { level: 1, name: /Guide workspace|向导工作台/i }),
  ).toBeVisible({ timeout: 60_000 });
});

test("修改密码页可访问", async ({ page }) => {
  await page.goto("/me/password");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Change password|修改密码/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Change password|修改密码/i })).toBeVisible();
});

test("社区用户主页可访问（占位 UUID）", async ({ page }) => {
  const profileId = "00000000-0000-4000-8000-000000000001";
  await page.goto(`/community/user/${profileId}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Member profile|用户主页/i })).toBeVisible();
  await expect(page.getByText(`ID: ${profileId}`)).toBeVisible({ timeout: 20_000 });
});

test("社区用户主页非法 id 可访问", async ({ page }) => {
  await page.goto("/community/user/not-a-uuid");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /User not found|用户不存在/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /User not found|用户不存在/i })).toBeVisible();
});

test("社区私信会话页可访问（占位会话 id）", async ({ page }) => {
  const convId = "00000000-0000-4000-8000-000000000001";
  await page.goto(`/community/messages/${convId}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Direct message thread|私信会话/i })).toBeVisible({ timeout: 20_000 });
  // Header back control is a Link (navigate to /community/messages), not a <button>.
  await expect(page.getByRole("link", { name: /Back|返回/i })).toBeVisible();
});

/** 53-S7：会话详情 URL 保留 ?orderId=（合法 UUID）时在消息区上方展示只读订单摘要卡片 */
test("社区私信会话页带 orderId 展示订单摘要区（53-S7）", async ({ page }) => {
  const convId = "00000000-0000-4000-8000-000000000088";
  const oid = "00000000-0000-4000-8000-000000000099";
  await page.goto(`/community/messages/${convId}?orderId=${encodeURIComponent(oid)}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Direct message thread|私信会话/i })).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: /本订单摘要|Order summary/i }).first(),
  ).toBeVisible({ timeout: 15_000 });
});

test("忘记密码页可访问", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Forgot password|忘记密码/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Forgot password|忘记密码/i })).toBeVisible();
});

test("重置密码页可访问", async ({ page }) => {
  await page.goto("/auth/reset-password");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Reset password|重置密码/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Reset password|重置密码/i })).toBeVisible();
});

test("邮箱验证页可访问", async ({ page }) => {
  await page.goto("/auth/verify-email");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Verify email|邮箱验证/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Verify email|邮箱验证/i })).toBeVisible();
});

test("争议详情页可访问（占位 UUID）", async ({ page }) => {
  await page.goto("/disputes/00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Dispute #|争议详情 #/ })).toBeVisible({ timeout: 25_000 });
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Dispute not found|未找到争议|Dispute #|争议详情 #/,
    }),
  ).toBeVisible({ timeout: 25_000 });
});

test("向导详情页可访问（占位 UUID）", async ({ page }) => {
  await page.goto("/guides/00000000-0000-4000-8000-000000000001");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Guide|向导/ })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 25_000 });
});

test("社区举报工单详情可访问（未登录提示）", async ({ page }) => {
  const ticketId = "00000000-0000-4000-8000-000000000001";
  await page.goto(`/community/me/reports/${ticketId}`);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Report ticket|举报工单/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Sign in to view|请先登录/i)).toBeVisible();
});

test("管理后台首页可访问（middleware 占位 Cookie）", async ({ page, baseURL }) => {
  const origin = baseURL ?? "http://localhost:3012";
  await page.context().addCookies([
    { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
  ]);
  await page.goto("/admin");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("main", { name: /Admin Workspace|管理后台/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Admin Workspace|管理后台/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Orders|订单/i })).toBeVisible();
});

test.describe("管理后台 FeeRouter、索引器、对账与财务（5.2A / 110 / 200 / 07 §5.7 可达性）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin FeeRouter 事件页可访问", async ({ page }) => {
    await page.goto("/admin/fee-router");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /FeeRouter routed events|FeeRouter 路由事件/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 财务摘要页可访问", async ({ page }) => {
    await page.goto("/admin/finance");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin finance summary|Admin 财务摘要/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 索引器健康页可访问", async ({ page }) => {
    await page.goto("/admin/indexer");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Indexer health|索引器健康/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 对账报告列表页可访问", async ({ page }) => {
    await page.goto("/admin/indexer/reconcile-reports");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Reconciliation reports|对账报告列表/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("管理后台订单、争议、评价、审批、可观测性与用户向导（70 / 120 / 07 §5.1·§5.6A·§5.6C 可达性）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin 订单列表页可访问", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Orders|订单/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 争议列表页可访问", async ({ page }) => {
    await page.goto("/admin/disputes");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin disputes|Admin 争议/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 评价列表页可访问", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin reviews|Admin 评价/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 用户列表页可访问", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /User management|用户管理/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 向导入驻台账页可访问", async ({ page }) => {
    await page.goto("/admin/guides");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Guide onboarding|向导入驻台账/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 审批列表页可访问", async ({ page }) => {
    await page.goto("/admin/approvals");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin approvals|Admin 审批/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 可观测性页可访问", async ({ page }) => {
    await page.goto("/admin/observability");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Observability|可观测性/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("管理后台审计、告警、社区风控与合规台账（70 / 100 / 120 / 160 / 07 §5.3B·§5.6C 可达性）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin 审计日志列表页可访问", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin audit logs|Admin 审计日志/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 运维审计动作页可访问", async ({ page }) => {
    await page.goto("/admin/audit/operations");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Audit operations|运维审计动作/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 告警 incident 入口页可访问", async ({ page }) => {
    await page.goto("/admin/alerts/incidents");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Alert incidents|告警 incident/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区举报工单页可访问", async ({ page }) => {
    await page.goto("/admin/community/reports");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community reports|社区举报工单/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin Schema 与迁移页可访问", async ({ page }) => {
    await page.goto("/admin/schema");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Schema & migrations|Schema 与迁移/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin DSAR 请求台账页可访问", async ({ page }) => {
    await page.goto("/admin/compliance/requests");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /DSAR requests|DSAR 请求台账/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("管理后台配置中心、任务调度与社区运营扩展（07 §5.8·Wave·160·70 可达性）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin 配置中心页可访问", async ({ page }) => {
    await page.goto("/admin/config");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Config center|配置中心/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 功能开关页可访问", async ({ page }) => {
    await page.goto("/admin/flags");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Feature flags|功能开关/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 异步任务队列页可访问", async ({ page }) => {
    await page.goto("/admin/jobs");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Async jobs|异步任务队列/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 配置发布登记页可访问", async ({ page }) => {
    await page.goto("/admin/config/releases");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Config releases|配置发布登记/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 调度运行记录页可访问", async ({ page }) => {
    await page.goto("/admin/scheduler/jobs");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Scheduler job runs|调度运行记录/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin Secret 元数据页可访问", async ({ page }) => {
    await page.goto("/admin/secrets/metadata");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Secret metadata|Secret 元数据/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 租户与区域作用域页可访问", async ({ page }) => {
    await page.goto("/admin/tenants/scopes");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Tenant & region scopes|租户与区域作用域/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区申诉台账页可访问", async ({ page }) => {
    await page.goto("/admin/community/appeals");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community appeals|社区申诉台账/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区审核审计行页可访问", async ({ page }) => {
    await page.goto("/admin/community/moderation/cases");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Community moderation cases|社区审核审计行/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区风险信号页可访问", async ({ page }) => {
    await page.goto("/admin/community/risk-signals");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community risk signals|社区风险信号/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin API 版本页可访问", async ({ page }) => {
    await page.goto("/admin/api-versions");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /API versions|API 版本/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("管理后台社区策略、生命周期、策略与媒体审计（160 / 70 / 07 §5.3B·§5.6C 可达性·补全）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin 社区策略变更审计页可访问", async ({ page }) => {
    await page.goto("/admin/community/policy-change-logs");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Community policy change logs|社区策略变更审计/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin Feed 排序快照页可访问", async ({ page }) => {
    await page.goto("/admin/community/ranking/snapshots");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Feed ranking snapshots|Feed 排序快照/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区处罚台账页可访问", async ({ page }) => {
    await page.goto("/admin/community/penalties");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community penalties|社区处罚台账/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 评论可见性页可访问", async ({ page }) => {
    await page.goto("/admin/community/comments/visibility");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Comment visibility|评论可见性/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区滥用策略页可访问", async ({ page }) => {
    await page.goto("/admin/community/abuse-policy");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community abuse policy|社区滥用策略/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 生命周期状态机页可访问", async ({ page }) => {
    await page.goto("/admin/lifecycle");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Lifecycle state machines|生命周期状态机/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 数据权限策略页可访问", async ({ page }) => {
    await page.goto("/admin/policies");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Data policies|数据权限策略/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 内部工具审计页可访问", async ({ page }) => {
    await page.goto("/admin/internal-tools/audits");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Internal tool audits|内部工具审计/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 媒体访问审计页可访问", async ({ page }) => {
    await page.goto("/admin/media/access-logs");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Media access logs|媒体访问审计/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 签名 URL 令牌台账页可访问", async ({ page }) => {
    await page.goto("/admin/media/signed-url-tokens");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Signed URL tokens|签名 URL 令牌台账/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 社区申诉复核页可访问", async ({ page }) => {
    await page.goto("/admin/community/appeals/review");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Community appeal review|社区申诉复核/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

/** 与列表页一致的占位 UUID；仅验证动态路由与详情壳渲染（API 可 404）。 */
const ADMIN_DETAIL_PLACEHOLDER_ID = "00000000-0000-4000-8000-0000000000ad";

test.describe("管理后台占位详情与单条报告页（70 / 110 / 07 §5.1·§5.6A·§5.7 路由可达）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin 订单详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/orders/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Order detail|订单详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 争议详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/disputes/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin dispute detail|Admin 争议详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 用户详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/users/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /User detail|用户详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 向导详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/guides/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin guide detail|Admin 向导详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 评价详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/reviews/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Admin review detail|Admin 评价详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 审批单详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/approvals/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Approval request detail|审批单详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 审计日志详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/audit/logs/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Audit log detail|审计日志详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 索引器对账报告详情页可访问（占位 report id）", async ({ page }) => {
    await page.goto(`/admin/indexer/reconcile/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Indexer reconcile report|索引器对账报告/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 配置发布详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/config/releases/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Config release|配置发布详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin 告警 incident 详情页可访问（占位 id）", async ({ page }) => {
    await page.goto(`/admin/alerts/incidents/${ADMIN_DETAIL_PLACEHOLDER_ID}`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Alert incident detail|告警 incident 详情/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});

test.describe("管理后台 DSAR 合规子页（500 / 70 / 07 §5.6C 可达性）", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const origin = baseURL ?? "http://localhost:3012";
    await page.context().addCookies([
      { name: "traveltrust_user_id", value: "e2e-smoke-admin", url: origin },
    ]);
  });

  test("Admin DSAR 事件轴页可访问（占位 requestId）", async ({ page }) => {
    const rid = ADMIN_DETAIL_PLACEHOLDER_ID;
    await page.goto(`/admin/compliance/requests/${encodeURIComponent(rid)}/events`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /DSAR event timeline|DSAR 事件轴/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("Admin DSAR 登记更新页可访问（占位 requestId）", async ({ page }) => {
    const rid = ADMIN_DETAIL_PLACEHOLDER_ID;
    await page.goto(`/admin/compliance/requests/${encodeURIComponent(rid)}/update`);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /DSAR update|DSAR 登记更新/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("main")).toBeVisible();
  });
});
