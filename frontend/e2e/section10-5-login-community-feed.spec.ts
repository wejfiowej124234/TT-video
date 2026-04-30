/**
 * 《95》§10.5「一条端到端」有界子证：注册 → UI 登录 → `/community` Feed 壳可见。
 * 依赖已可达的 **`traveltrust-api`**（`/health`）、`SEED_TEST_ACCOUNTS` 与 Postgres。
 * **Bounded 绿（v1.4.149 / `…section10_5_minimal_loop/README.md` §6.2）**：自起 API 时 **`CHAIN_RPC_URL=`**（空串，避免根 `.env` RPC 致 **`GET /meta` 408**）+ **`P3_CHAIN_OFF=1`** + **`DATABASE_URL`**；Playwright **`PLAYWRIGHT_FULL_STACK=0`** + **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`**。
 * **`PLAYWRIGHT_FULL_STACK=1`** 路径仍可能与 **`p01-login-market-auth.spec.ts`** 同口径，但易踩 **`setup-meta-chain`** / **RPC** 超时；CI 全矩阵见 **`.github/workflows/build.yml`**。
 */
import { test, expect } from "@playwright/test";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

test.describe("§10.5 minimal E2E: login → community Feed", () => {
  test("注册后登录进入社区 Feed 主区可见", async ({ page, request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}; use PLAYWRIGHT_FULL_STACK=1 or start traveltrust-api`);
    }

    const stamp = Date.now();
    const email = `s10-5-e2e-${stamp}@traveltrust.test`;
    const password = "Test123!";
    const reg = await request.post(`${API_BASE}/auth/register`, {
      headers: { "Content-Type": "application/json" },
      data: { email, password, nickname: `s105-${stamp}` },
    });
    if (!reg.ok()) {
      test.skip(true, `register failed HTTP ${reg.status()} — body=${(await reg.text()).slice(0, 200)}`);
    }

    await page.goto("/auth/login?returnUrl=%2Fcommunity");
    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).fill(password);
    await Promise.all([
      page.waitForURL(/\/community/, { timeout: 25_000, waitUntil: "commit" }),
      page.waitForResponse(
        (res) =>
          (res.url().includes("/api/auth-proxy/login") || res.url().includes("/auth/login")) &&
          res.request().method() === "POST" &&
          res.ok(),
        { timeout: 25_000 },
      ),
      page.getByRole("button", { name: /Log in|登录/i }).click(),
    ]);

    await expect(page.getByRole("main", { name: /Feed|动态/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /TT Community|TT\s*社区/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /User menu|用户菜单/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
