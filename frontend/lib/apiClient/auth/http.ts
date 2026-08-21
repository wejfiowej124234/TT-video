import { apiUrl, routes } from "../../api";
import {
  requestId,
  parseResponse,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";

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
    credentials: "include",
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
  verification_code?: string;
  /** 693/697：`tourist` \| **`traveler`**（87 协议名，697 起后端存 `traveler`）\| `provider` \| `region_steward`；缺省为游客（后端 `tourist`） */
  role?: string;
  /** G-S1 · 可选推荐码（与 `?ref=` 同源） */
  referral_code?: string;
}): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.register), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postRegister", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postRegisterSendVerificationCode(body: {
  email: string;
}): Promise<{
  registration_verification_dev_code?: string;
  email_sent?: boolean;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.auth.registerSendVerificationCode), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postRegisterSendVerificationCode", data);
  throwUnlessApiOk(data);
  const payload = data as {
    registration_verification_dev_code?: string;
    email_sent?: boolean;
    message?: string;
  };
  if (payload.email_sent === false) {
    throw new Error("email_delivery_failed");
  }
  return payload;
}

export async function postLogout(body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(apiUrl(routes.auth.logout), {
    method: "POST",
    credentials: "include",
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
    credentials: "include",
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

export async function postResendVerificationEmail(): Promise<{
  email_verification_dev_token?: string;
  message?: string;
}> {
  const res = await fetch(apiUrl(routes.auth.resendVerificationEmail), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...writeRequestHeaders() },
    body: JSON.stringify({}),
  });
  const data = await parseResponse(res);
  logApiJsonStatusNotOk("postResendVerificationEmail", data);
  throwUnlessApiOk(data);
  return data as { email_verification_dev_token?: string; message?: string };
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
