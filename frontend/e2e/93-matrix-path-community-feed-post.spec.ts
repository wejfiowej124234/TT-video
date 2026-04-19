/**
 * 93 矩阵 · 第二条证据路径：**登录 → 社区 Feed → 发帖 → 帖子可读 / Feed 深链**
 *（`evidence/GO_20260419/93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md`）。
 *
 * 用例映射：**A-LOG-001**（会话）· **D-COM-001**（feed）· **D-COM-002**（POST + GET）·
 * 前端 **`/community`**、**`/community?post=`**（与 **`/community/post/[id]`** 重定向等价）。
 */
import { test, expect } from "@playwright/test";
import { apiLoginReturnCredentials, gotoWithBearerSession, seedTestAccounts } from "./helpers/apiSession";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = (process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`).replace(/\/$/, "");

test.describe("93-matrix · community feed → text post → detail deep link", () => {
  test("API D-COM-001/002 + UI Feed + ?post=", async ({ page, request }) => {
    test.setTimeout(180_000);

    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API 不可用：${API_HEALTH}`);
    }

    await seedTestAccounts(request, API_BASE);

    const cred = await apiLoginReturnCredentials(request, API_BASE, "tourist@test.com", "Test123!");
    expect(cred, "tourist@test.com login").toBeTruthy();
    const token = cred!.token;
    const userId = cred!.userId ?? "";

    const feedRes = await request.get(`${API_BASE}/api/v1/community/feed`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(feedRes.ok(), await feedRes.text()).toBeTruthy();

    const stamp = Date.now();
    const bodyText = `93-matrix-community-${stamp}`;
    const idem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `93-com-${stamp}`;

    const createRes = await request.post(`${API_BASE}/api/v1/community/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idem,
      },
      data: { post_type: "text", body: bodyText },
    });
    expect(createRes.ok(), await createRes.text()).toBeTruthy();
    const created = (await createRes.json()) as { id?: string; status?: string };
    expect(created.status).toBe("ok");
    const postId = (created.id ?? "").trim();
    expect(postId.length).toBeGreaterThan(10);

    const detailRes = await request.get(`${API_BASE}/api/v1/community/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(detailRes.ok(), await detailRes.text()).toBeTruthy();
    const detailText = await detailRes.text();
    expect(detailText).toContain(bodyText);

    await gotoWithBearerSession(page, "/community", { token, userId });
    await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible({ timeout: 35_000 });
    await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`/community?post=${encodeURIComponent(postId)}`, { timeout: 60_000 });
    await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible({ timeout: 35_000 });
    await expect(page).toHaveURL(new RegExp(`[?&]post=${postId}`));
    // 详情层部分布局在折叠卡内，Playwright `toBeVisible` 对 line-clamp 子树可能判 hidden；用 main 内 HTML 文本兜底（与 D-COM-002「可读」一致）。
    await expect
      .poll(
        async () => (await page.getByRole("main", { name: /Feed|动态/i }).innerText()).includes(bodyText),
        { timeout: 45_000 },
      )
      .toBe(true);
  });
});
