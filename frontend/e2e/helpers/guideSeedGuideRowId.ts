/**
 * `GET /api/v1/guides` 在含多向导（含 DB hydrate）时 `items[0]` 未必对应 `guide@test.com`。
 * 种子向导行 id 以向导账号 `GET /api/v1/me` 的 `guide.id` 为 SSOT（与 `order.guide_id` 一致）。
 */
import type { APIRequestContext } from "@playwright/test";

export async function guideRowIdForSeedGuideAccount(
  request: APIRequestContext,
  apiBase: string,
): Promise<string | null> {
  const login = await request.post(`${apiBase}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: "guide@test.com", password: "Test123!" },
  });
  if (!login.ok()) return null;
  const { token } = (await login.json()) as { token?: string };
  const t = token?.trim();
  if (!t) return null;
  const me = await request.get(`${apiBase}/api/v1/me`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!me.ok()) return null;
  const body = (await me.json()) as { guide?: { id?: string } | null };
  return body.guide?.id?.trim() ?? null;
}
