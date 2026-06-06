import type { APIRequestContext } from "@playwright/test";

import { apiLoginReturnCredentials } from "./apiSession";

/** 串行窄 E2E 专用：独立游客账号，避免 `community_abuse_policy` 同用户 post/report 最短间隔 429。 */
export async function registerFreshTourist(
  request: APIRequestContext,
  apiBase: string,
  label = "narrow",
): Promise<{ token: string; userId: string }> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-${label}-${stamp}@traveltrust.test`;
  const password = "Test123!";
  const res = await request.post(`${apiBase}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: { email, password, nickname: "E2E Narrow", role: "tourist" },
  });
  if (!res.ok() && res.status() !== 201) {
    throw new Error(`registerFreshTourist failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { token?: string; user_id?: string; id?: string };
  const token = (json.token ?? "").trim();
  const userId = (json.user_id ?? json.id ?? "").trim();
  if (!token || !userId) {
    throw new Error(`registerFreshTourist missing token/user_id: ${JSON.stringify(json)}`);
  }
  return { token, userId };
}

export async function resolveSeedUserId(
  request: APIRequestContext,
  apiBase: string,
  email: string,
  password = "Test123!",
): Promise<{ token: string; userId: string } | null> {
  const cred = await apiLoginReturnCredentials(request, apiBase, email, password);
  if (!cred?.token) return null;
  if (cred.userId) {
    return { token: cred.token, userId: cred.userId };
  }
  const meRes = await request.get(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${cred.token}` },
  });
  if (!meRes.ok()) return null;
  const me = (await meRes.json()) as { user_id?: string; id?: string };
  const userId = (me.user_id ?? me.id ?? "").trim();
  if (!userId) return null;
  return { token: cred.token, userId };
}

export async function apiFollowUser(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  targetUserId: string,
): Promise<void> {
  const res = await request.post(`${apiBase}/api/v1/community/users/${encodeURIComponent(targetUserId)}/follow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`follow failed: ${res.status()} ${await res.text()}`);
  }
}

export async function apiCreateTextPost(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  body: string,
): Promise<string> {
  const stamp = Date.now();
  const idem =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `post-${stamp}`;
  const res = await request.post(`${apiBase}/api/v1/community/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idem,
    },
    data: { post_type: "text", body },
  });
  if (!res.ok()) {
    throw new Error(`create post failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { id?: string; status?: string };
  const id = (json.id ?? "").trim();
  if (json.status !== "ok" || !id) {
    throw new Error(`create post missing id: ${JSON.stringify(json)}`);
  }
  return id;
}

export async function apiPostCommunityReport(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  targetType: "post" | "comment",
  targetId: string,
  reasonCode = "spam",
): Promise<{ reportId?: string }> {
  const res = await request.post(`${apiBase}/api/v1/community/reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: {
      target_type: targetType,
      target_id: targetId,
      reason_code: reasonCode,
      details: "e2e-narrow-flow",
    },
  });
  if (!res.ok()) {
    throw new Error(`post report failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { status?: string; id?: string; report_id?: string };
  if (json.status !== "ok") {
    throw new Error(`post report not ok: ${JSON.stringify(json)}`);
  }
  return { reportId: (json.id ?? json.report_id ?? "").trim() || undefined };
}

export async function apiEnsureConversation(
  request: APIRequestContext,
  apiBase: string,
  token: string,
  peerUserId: string,
): Promise<string> {
  const res = await request.post(`${apiBase}/api/v1/community/conversations/ensure`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { peer_user_id: peerUserId },
  });
  if (!res.ok()) {
    throw new Error(`ensure conversation failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { id?: string; status?: string };
  const id = (body.id ?? "").trim();
  if (!id) {
    throw new Error(`ensure conversation missing id: ${JSON.stringify(body)}`);
  }
  return id;
}
