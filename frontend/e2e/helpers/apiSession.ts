import type { APIRequestContext, Page } from "@playwright/test";
import { releaseSeedGuideSlotIfBlocked } from "./releaseSeedGuideSlot";

const apiPort = process.env.PLAYWRIGHT_API_PORT ?? "8080";

export function defaultApiBase(): string {
  return (process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`).replace(/\/$/, "");
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
  await page.goto(path);
}
