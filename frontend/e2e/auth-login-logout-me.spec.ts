/**
 * 登录 → GET /api/v1/me → POST /auth/logout → 旧 token 再 GET /me 须 401（服务端 session 已删）。
 * 直连 traveltrust-api（:8080），与浏览器 Network 行为一致；须 API 可达且已 seed 测试账号。
 */
import { test, expect } from "@playwright/test";

const API_HEALTH = process.env.PLAYWRIGHT_API_HEALTH_URL ?? "http://127.0.0.1:8080/health";
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080";

test.describe("auth logout invalidates session (GET /api/v1/me)", () => {
  test("登录后登出，旧 Bearer 访问 /api/v1/me 返回 401", async ({ request }) => {
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(true, `API not reachable at ${API_HEALTH}; start traveltrust-api`);
    }

    const login = await request.post(`${API_BASE}/auth/login`, {
      headers: { "Content-Type": "application/json" },
      data: { email: "tourist@test.com", password: "Test123!" },
    });
    expect(login.ok(), `login HTTP ${login.status()}`).toBeTruthy();
    const loginJson = (await login.json()) as { status?: string; token?: string };
    expect(loginJson.status).toBe("ok");
    const token = loginJson.token?.trim();
    expect(token?.startsWith("tts_") || token?.startsWith("bearer_")).toBeTruthy();

    const me1 = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me1.status()).toBe(200);
    const me1Json = (await me1.json()) as { status?: string };
    expect(me1Json.status).toBe("ok");

    const idem =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const logout = await request.post(`${API_BASE}/auth/logout`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": idem,
        "X-Idempotency-Key": idem,
      },
      data: "{}",
    });
    expect(logout.ok(), `logout HTTP ${logout.status()}`).toBeTruthy();
    const logoutJson = (await logout.json()) as { status?: string };
    expect(logoutJson.status).toBe("ok");

    const me2 = await request.get(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me2.status()).toBe(401);
    const me2Json = (await me2.json()) as { error?: string };
    expect(me2Json.error).toBe("login_required");
  });
});
