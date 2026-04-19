/**
 * 认证 API：登录、注册、登出、刷新、验证邮箱、忘记/重置密码；测试账号种子。
 * 51-H2/51-B1：verify/forgot/reset 后端为 stub 时前端照常调用；真实实现（邮件/令牌）待 51-B1 落地后对接。
 */

import { apiUrl, routes } from "../api";
import {
  requestId,
  parseResponse,
  writeRequestHeaders,
  AUTH_SESSION_TOKEN_KEY,
  AUTH_USER_ID_KEY,
  clearClientAuthStorage,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";
import { clearGetMeCache } from "./me";

/**
 * 在 **`POST /auth/logout` 已成功**（HTTP 2xx 且 envelope `status:ok`）后调用：清 getMe 缓存、localStorage 凭证、cookie，并广播 `traveltrust:auth-change`（B-065）。
 * 禁止在服务端确认前调用，以免假登出。
 */
export function applyLocalLogoutAfterServerOk(): void {
  clearGetMeCache();
  clearClientAuthStorage();
  if (typeof document !== "undefined") {
    document.cookie = "traveltrust_user_id=; Path=/; Max-Age=0; SameSite=Lax";
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  }
}

/**
 * 登录/注册成功后写入浏览器会话并通知全站（07 Phase 4、53-S23：顶栏/getMe 与社区同源）。
 * @returns 已写入的 user_id，失败时 undefined
 */
export function applyClientSessionAfterAuth(res: unknown): string | undefined {
  const userId = (res as { user_id?: string })?.user_id?.trim();
  const token = (res as { token?: string })?.token?.trim();
  if (!userId || typeof window === "undefined") return undefined;
  localStorage.setItem(AUTH_USER_ID_KEY, userId);
  if (token) {
    localStorage.setItem(AUTH_SESSION_TOKEN_KEY, token);
  }
  document.cookie = `traveltrust_user_id=${encodeURIComponent(userId)}; Path=/; SameSite=Lax`;
  clearGetMeCache();
  window.dispatchEvent(new CustomEvent("traveltrust:auth-change"));
  return userId;
}

export async function postSeedTestAccounts(): Promise<{ seeded?: boolean; disabled?: boolean }> {
  const res = await fetch(apiUrl(routes.auth.seedTestAccounts), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-request-id": requestId() },
    body: "{}",
  });
  if (res.status === 403) return { disabled: true };
  if (!res.ok) return { disabled: true };
  const data = await res.json().catch(() => ({}));
  logApiJsonStatusNotOk("postSeedTestAccounts", data);
  return { seeded: true, ...data };
}

export async function postLogin(body: { email: string; password: string }): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.login), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postLogin", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postRegister(body: {
  email: string;
  password: string;
  nickname?: string;
  default_wallet_address?: string;
  /** 693/697：`tourist` \| **`traveler`**（87 协议名，697 起后端存 `traveler`）\| `provider` \| `region_steward`；缺省为旅行者（后端 `tourist`） */
  role?: string;
}): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.register), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postRegister", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postLogout(body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.logout), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postLogout", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postRefresh(body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.refresh), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postRefresh", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postVerifyEmail(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.verifyEmail), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postVerifyEmail", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postForgotPassword(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.forgotPassword), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postForgotPassword", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postResetPassword(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.resetPassword), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postResetPassword", data);
  throwUnlessApiOk(data);
  return data;
}
