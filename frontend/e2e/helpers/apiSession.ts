import type { APIRequestContext, Page } from "@playwright/test";
import { releaseSeedGuideSlotIfBlocked } from "./releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";

export function defaultApiBase(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`).replace(/\/$/, "");
}

export function defaultApiHealthUrl(): string {
  return process.env.PLAYWRIGHT_API_HEALTH_URL ?? `http://127.0.0.1:${apiPort}/health`;
}

export async function seedTestAccounts(request: APIRequestContext, apiBase: string): Promise<void> {
  await request
    .post(`${apiBase}/auth/seed-test-accounts`, {
      headers: { "Content-Type": "application/json" },
      data: "{}",
    })
    .catch(() => null);
}

/** seed + 释放种子向导档期（与 P02/P03 同源，降低 guide_has_active_order 等间接 flake） */
export async function seedTestAccountsAndReleaseGuideSlot(
  request: APIRequestContext,
  apiBase: string,
): Promise<void> {
  await seedTestAccounts(request, apiBase);
  await releaseSeedGuideSlotIfBlocked(request, apiBase);
}

export async function apiLoginReturnToken(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<string | null> {
  const s = await apiLoginReturnCredentials(request, apiBase, email, password);
  return s?.token ?? null;
}

/** 与真实登录响应同形，供 E2E 写满 localStorage（Bearer + X-User-Id 回退路径）。 */
export async function apiLoginReturnCredentials(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<{ token: string; userId: string } | null> {
  const res = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { token?: string; user_id?: string };
  const t = body.token?.trim();
  const uid = body.user_id?.trim();
  if (!t) return null;
  if (!uid) return { token: t, userId: "" };
  return { token: t, userId: uid };
}

const LS_TOKEN_KEY = "traveltrust_session_token";
const LS_USER_KEY = "traveltrust_user_id";

/**
 * 在**任意页面脚本运行前**写入会话再 `goto`，避免首屏 `getMe` 与 `localStorage` 竞态（L4 workers=2 下曾误判未登录）。
 * 传入 `userId` 时同时写 cookie，与 `applyClientSessionAfterAuth` 对齐。
 */
/** `STRICT_SESSION_GATE=1` 下提交前再写一次 token，避免首屏竞态或中间态清空 localStorage。 */
export async function refreshBearerSessionInPage(
  page: Page,
  session: string | { token: string; userId?: string },
): Promise<void> {
  const token = typeof session === "string" ? session : session.token;
  const userId = (typeof session === "string" ? "" : session.userId?.trim()) ?? "";
  await page.evaluate(
    ([tok, uid]) => {
      try {
        localStorage.setItem(LS_TOKEN_KEY, tok);
        if (uid) {
          localStorage.setItem(LS_USER_KEY, uid);
          document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; SameSite=Lax`;
        }
      } catch {
        /* ignore */
      }
    },
    [token, userId] as [string, string],
  );
}

function isTransientBrowserGotoError(message: string): boolean {
  return /ERR_CONNECTION_CLOSED|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|ERR_HTTP2_PROTOCOL_ERROR|ERR_SOCKET_NOT_CONNECTED|ERR_INTERNET_DISCONNECTED|ERR_SSL_PROTOCOL_ERROR|ETIMEDOUT|ECONNRESET|NS_ERROR_NET_RESET|Timeout/i.test(
    message,
  );
}

export async function gotoWithBearerSession(
  page: Page,
  path: string,
  session: string | { token: string; userId?: string },
): Promise<void> {
  const token = typeof session === "string" ? session : session.token;
  const userId = (typeof session === "string" ? "" : session.userId?.trim()) ?? "";
  await page.addInitScript(
    ([tok, uid]) => {
      try {
        sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
        localStorage.setItem(LS_TOKEN_KEY, tok);
        if (uid) {
          localStorage.setItem(LS_USER_KEY, uid);
          document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; SameSite=Lax`;
        }
      } catch {
        /* ignore */
      }
    },
    [token, userId] as [string, string],
  );
  await gotoWithLoadRetry(page, path, { waitUntil: "domcontentloaded" });
}

/** Staging E2E: retry transient Fly / TLS flakes (PLAYWRIGHT_GOTO_* env). */
export async function gotoWithLoadRetry(
  page: Page,
  path: string,
  options?: { waitUntil?: "domcontentloaded" | "load" },
): Promise<void> {
  const gotoTimeout = Number(process.env.PLAYWRIGHT_GOTO_TIMEOUT_MS ?? 120_000);
  const maxAttempts = Math.max(
    1,
    Number.parseInt(process.env.PLAYWRIGHT_GOTO_RETRY_ATTEMPTS ?? "1", 10) || 1,
  );
  const waitUntil = options?.waitUntil ?? "load";
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(path, { waitUntil, timeout: gotoTimeout });
      return;
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt >= maxAttempts || !isTransientBrowserGotoError(msg)) throw e;
      await page.waitForTimeout(Math.min(2500 * attempt, 12_000));
    }
  }
  throw lastError;
}

export type BearerSessionCredentials = { token: string; userId?: string };

export async function seedAndLoginTouristTestCredentials(
  request: APIRequestContext,
  apiBase: string,
  password = "Test123!",
): Promise<BearerSessionCredentials | null> {
  await seedTestAccounts(request, apiBase);
  return apiLoginReturnCredentials(request, apiBase, "tourist@test.com", password);
}

export async function seedAndLoginGuideTestCredentials(
  request: APIRequestContext,
  apiBase: string,
  password = "Test123!",
): Promise<BearerSessionCredentials | null> {
  await seedTestAccountsAndReleaseGuideSlot(request, apiBase);
  return apiLoginReturnCredentials(request, apiBase, "guide@test.com", password);
}

export async function apiLoginReturnRoleEnvelope(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password: string,
): Promise<{ token: string; userId: string; role?: string } | null> {
  const res = await request.post(`${apiBase.replace(/\/$/, "")}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { token?: string; user_id?: string; role?: string };
  const token = body.token?.trim();
  if (!token) return null;
  return { token, userId: body.user_id?.trim() ?? "", role: body.role?.trim() };
}

export async function injectBearerSessionInPage(
  page: Page,
  session: BearerSessionCredentials,
): Promise<void> {
  const token = session.token;
  const userId = session.userId?.trim() ?? "";
  await page.evaluate(
    ([tok, uid]) => {
      try {
        sessionStorage.removeItem("traveltrust_dev_api_offline_v1");
        localStorage.setItem("traveltrust_session_token", tok);
        if (uid) {
          localStorage.setItem("traveltrust_user_id", uid);
          document.cookie = `traveltrust_user_id=${encodeURIComponent(uid)}; Path=/; SameSite=Lax`;
        }
      } catch {
        /* ignore */
      }
    },
    [token, userId] as [string, string],
  );
}

/**
 * Next 冷启时首屏 `getMe` 可能触发 dev-api-offline 并清 token；Feed 壳就绪后重注入并等浏览器侧 `GET /api/v1/me` 200。
 * 已登录页重注入时 `/me` 可能不再发起 — 回退 `fetch('/api/v1/me')` 探针。
 */
export async function ensureCommunityBrowserSessionAccepted(
  page: Page,
  session: BearerSessionCredentials,
  timeoutMs = 90_000,
): Promise<void> {
  const token = session.token.trim();
  if (!token) throw new Error("community_session_not_accepted");

  await injectBearerSessionInPage(page, session);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const slice = Math.min(8_000, deadline - Date.now());
    if (slice <= 0) break;
    try {
      await page.waitForResponse((res) => {
        if (res.request().method() !== "GET" || res.status() !== 200) return false;
        try {
          return new URL(res.url()).pathname.replace(/\/+$/, "") === "/api/v1/me";
        } catch {
          return false;
        }
      }, { timeout: slice });
      return;
    } catch {
      const ok = await page.evaluate(async (tok) => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const r = await fetch("/api/v1/me", {
              headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
            });
            if (r.status === 200) return true;
            if ([502, 503, 504].includes(r.status) && attempt < 3) {
              await sleep(600 * (attempt + 1));
              continue;
            }
          } catch {
            if (attempt < 3) {
              await sleep(600 * (attempt + 1));
              continue;
            }
          }
        }
        return false;
      }, token);
      if (ok) return;
      await page.waitForTimeout(400);
    }
  }
  throw new Error("community_session_not_accepted");
}

export async function clearBearerSessionInBrowser(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.removeItem("traveltrust_session_token");
      localStorage.removeItem("traveltrust_user_id");
      document.cookie = "traveltrust_user_id=; Path=/; Max-Age=0; SameSite=Lax";
    } catch {
      /* ignore */
    }
  });
}
