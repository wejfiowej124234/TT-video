/**
 * 注册 → 登录 → /market：抓取 Network 等价响应（POST /auth/register、POST /auth/login、
 * GET /api/v1/me、GET /api/v1/discover/orders），断言 JSON 与 user_id 一致；可选与 DB 对齐见
 * `frontend/scripts/verify-auth-session-pg.mjs`。
 *
 * 前置：本机 API（默认经 Next rewrites 代理到 8080）与 `NEXT_PUBLIC_API_BASE_URL` 一致；
 * `DATABASE_URL`：设 `PLAYWRIGHT_VERIFY_PG=1` 时在校验前从环境读取，用于 **sessions** 与 **users** 对齐（B-458 封口）。
 *
 * **B-458**：登录进入 `/market` 后 **`page.reload()`**，须再出现 **`GET /api/v1/me` → 200**（`status: ok`），不得以「仅导航中多次 me」替代。
 */
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

function errnoOf(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e
    ? String((e as NodeJS.ErrnoException).code)
    : undefined;
}

/** 优先本机 `psql $DATABASE_URL`；无 psql 时回退 `docker exec traveltrust-postgres psql`（与 docker-compose 默认库名/用户一致）。 */
function pgScalar(sql: string): string {
  const dbUrl = process.env.DATABASE_URL!.trim();
  try {
    return execFileSync("psql", [dbUrl, "-t", "-A", "-c", sql], { encoding: "utf8" }).trim();
  } catch (e) {
    if (errnoOf(e) !== "ENOENT") throw e;
  }
  return execFileSync(
    "docker",
    [
      "exec",
      "traveltrust-postgres",
      "psql",
      "-U",
      "traveltrust",
      "-d",
      "traveltrust",
      "-t",
      "-A",
      "-c",
      sql,
    ],
    { encoding: "utf8" },
  ).trim();
}

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";
const API_HEALTH =
  process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;

type Json = Record<string, unknown>;

function isRecord(x: unknown): x is Json {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

test.describe("auth chain: register → login → /market (network bodies)", () => {
  test.describe.configure({ mode: "serial" });

  test("POST /auth/*、GET /me、GET discover/orders 与同一 user_id 对齐", async ({ page, request }) => {
    test.setTimeout(120_000);
    const health = await request.get(API_HEALTH).catch(() => null);
    if (!health?.ok()) {
      test.skip(
        true,
        `API not reachable at ${API_HEALTH}; start traveltrust-api and align NEXT_PUBLIC_API_BASE_URL`,
      );
    }

    const stamp = Date.now();
    const email = `e2e-chain-${stamp}@e2e.local`;
    const password = "TestChain9!";

    const captured: {
      register?: Json;
      login?: Json;
      me: Json[];
      discover: Json[];
    } = { me: [], discover: [] };

    page.on("response", async (res) => {
      if (!res.ok()) return;
      const ct = (res.headers()["content-type"] ?? "").toLowerCase();
      if (!ct.includes("application/json")) return;
      const url = res.url();
      const method = res.request().method();
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        return;
      }
      if (!isRecord(body)) return;

      if (method === "POST" && url.includes("/auth/register")) {
        captured.register = body;
      } else if (method === "POST" && url.includes("/auth/login")) {
        captured.login = body;
      } else if (method === "GET" && url.includes("/api/v1/me") && !url.includes("/api/v1/media/")) {
        captured.me.push(body);
      } else if (method === "GET" && url.includes("/api/v1/discover/orders")) {
        captured.discover.push(body);
      }
    });

    const loginReturn = `/auth/login?returnUrl=${encodeURIComponent("/market")}`;
    await page.goto(`/auth/register?returnUrl=${encodeURIComponent(loginReturn)}`);

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).first().fill(password);
    await page.getByLabel(/confirm|确认/i).fill(password);
    await page.getByRole("button", { name: /^(Register|注册)$/i }).click();

    await page.waitForURL(/\/auth\/login/, { timeout: 25_000 });

    await page.getByRole("textbox", { name: /email|邮箱/i }).fill(email);
    await page.getByLabel(/password|密码/i).fill(password);
    await page.getByRole("button", { name: /log in|登录/i }).click();

    await page.waitForURL(/\/market/, { timeout: 25_000 });

    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(
        () =>
          captured.discover.length > 0 &&
          captured.me.some((m) => m.status === "ok"),
        { timeout: 20_000 },
      )
      .toBe(true);

    expect(captured.register, "POST /auth/register JSON").toBeDefined();
    expect(captured.register?.status).toBe("ok");
    const regUid = String(captured.register?.user_id ?? "");
    expect(regUid.length).toBeGreaterThan(10);
    expect(String(captured.register?.token ?? "")).toMatch(/^tts_/);

    expect(captured.login, "POST /auth/login JSON").toBeDefined();
    expect(captured.login?.status).toBe("ok");
    expect(String(captured.login?.user_id)).toBe(regUid);
    expect(String(captured.login?.token ?? "")).toMatch(/^tts_/);

    const meOk = captured.me.filter((m) => m.status === "ok");
    expect(meOk.length, "至少一次 GET /api/v1/me status ok").toBeGreaterThan(0);
    const meUser = meOk[meOk.length - 1]?.user;
    expect(isRecord(meUser), "me.user 为对象").toBe(true);
    if (isRecord(meUser)) {
      expect(String(meUser.id)).toBe(regUid);
      expect(String(meUser.email)).toBe(email);
    }

    expect(captured.discover.length, "至少一次 GET discover/orders").toBeGreaterThan(0);
    const disc = captured.discover[captured.discover.length - 1];
    expect(disc?.status).toBe("ok");
    expect(Array.isArray(disc?.items)).toBe(true);

    const meCapturedBeforeReload = captured.me.length;

    await expect(page.locator('[data-testid="market-page"]')).toBeVisible({ timeout: 15_000 });

    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-testid="market-page"]')).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(
        () => {
          if (captured.me.length <= meCapturedBeforeReload) return false;
          const last = captured.me[captured.me.length - 1];
          if (last?.status !== "ok" || !isRecord(last.user)) return false;
          return String(last.user.id) === regUid;
        },
        { timeout: 25_000 },
      )
      .toBe(true);

    const uidLs = await page.evaluate(() => localStorage.getItem("traveltrust_user_id"));
    const tokLs = await page.evaluate(() => localStorage.getItem("traveltrust_session_token"));
    expect(uidLs).toBe(regUid);
    expect(String(tokLs)).toBe(String(captured.login?.token));

    if (process.env.PLAYWRIGHT_VERIFY_PG === "1" && process.env.DATABASE_URL?.trim()) {
      const tok = String(captured.login?.token ?? "").replace(/'/g, "''");
      const em = email.replace(/'/g, "''");
      try {
        const usersCount = pgScalar(
          `SELECT count(*)::text FROM users WHERE lower(email) = lower('${em}')`,
        );
        expect(usersCount, "PostgreSQL users 行存在").toBe("1");
        const sql = `SELECT count(*)::text FROM sessions s JOIN users u ON u.id = s.user_id WHERE lower(u.email) = lower('${em}') AND s.token = '${tok}'`;
        const out = pgScalar(sql);
        expect(out, "sessions 行应与 login token、users.email 一致").toBe("1");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(
          `PLAYWRIGHT_VERIFY_PG：需要本机 psql（或 Docker 容器 traveltrust-postgres）且可连 DATABASE_URL。${msg}`,
        );
      }
    }
  });
});
